from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
import psycopg2
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

#Models
#from models import Event, EventType, Era  # Import the Event class here

from models import Meal


app = FastAPI()

# Database connection details
DATABASE_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins. Change to ["http://localhost:3000"] for specific origins.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def get_db_connection():
    conn = psycopg2.connect(**DATABASE_CONFIG)
    return conn

@app.post("/meals")
def create_meal(meal: Meal):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 1) Insert into meals table
        insert_meal_query = """
        INSERT INTO meals
        (name, rating, portions, protein_powder, heatable, must_be_heated,
         meal_type, meal_category, meal_category_icon, procedure, image, date_time)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        cursor.execute(
            insert_meal_query,
            (
                meal.name,
                meal.rating,
                meal.portions,
                meal.protein_powder,
                meal.heatable,
                meal.must_be_heated,
                meal.meal_type,
                meal.meal_category,
                meal.meal_category_icon,
                meal.procedure,
                meal.image,
                meal.date_time
            )
        )
        new_meal_id = cursor.fetchone()["id"]

        # 2) Insert ingredients
        insert_ingredient_query = """
        INSERT INTO meal_ingredients
        (meal_id, ingredient_text, ingredient_type, grams, number)
        VALUES (%s, %s, %s, %s, %s)
        """
        for ing in meal.ingredients:
            cursor.execute(
                insert_ingredient_query,
                (new_meal_id, ing.text, ing.type, ing.grams, ing.number)
            )

        # 3) Insert protein_addons
        insert_protein_addon_query = """
        INSERT INTO meal_protein_addons
        (meal_id, addon_text, addon_type, grams, number)
        VALUES (%s, %s, %s, %s, %s)
        """
        for addon in meal.protein_addons:
            cursor.execute(
                insert_protein_addon_query,
                (new_meal_id, addon.text, addon.type, addon.grams, addon.number)
            )

        # 4) Insert nutrients
        insert_nutrients_query = """
        INSERT INTO meal_nutrients
        (meal_id, calories, protein, carbs, fat, fibre)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            insert_nutrients_query,
            (
                new_meal_id,
                meal.nutrients.calories,
                meal.nutrients.protein,
                meal.nutrients.carbs,
                meal.nutrients.fat,
                meal.nutrients.fibre
            )
        )

        conn.commit()
        return {"message": "Meal created successfully", "meal_id": new_meal_id}

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()