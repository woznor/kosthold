from fastapi import FastAPI, HTTPException, Query
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

@app.put("/add_meals")
def create_meal(meal: Meal):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 1) INSERT INTO health_app.meals table
        insert_meal_query = """
        INSERT INTO health_app.meals
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
        print("DEBUG id =", new_meal_id)
   

        # 2) Insert ingredients
        insert_ingredient_query = """
        INSERT INTO health_app.meal_ingredients
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
        INSERT INTO health_app.meal_protein_addons
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
        INSERT INTO health_app.meal_nutrients
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


@app.get("/all_meals")
def get_all_meals(portions: int = Query(1, ge=1)):
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1) Fetch all meals
        cursor.execute("SELECT * FROM health_app.meals;")
        meals = cursor.fetchall()

        # 2) Fetch all ingredients
        cursor.execute("SELECT * FROM health_app.meal_ingredients;")
        ingredients = cursor.fetchall()

        # 3) Fetch all protein_addons
        cursor.execute("SELECT * FROM health_app.meal_protein_addons;")
        addons = cursor.fetchall()

        # 4) Fetch all nutrients
        cursor.execute("SELECT * FROM health_app.meal_nutrients;")
        nutrients = cursor.fetchall()

        # Build a dictionary keyed by meal_id
        meal_map = {}
        for meal in meals:
            meal_id = meal["id"]
            meal_map[meal_id] = {
                "id": meal["id"],
                "name": meal["name"],
                "rating": meal["rating"],
                "portions": meal["portions"],
                "protein_powder": meal["protein_powder"],
                "heatable": meal["heatable"],
                "must_be_heated": meal["must_be_heated"],
                "meal_type": meal["meal_type"],  # integer[] or similar
                "meal_category": meal["meal_category"],
                "meal_category_icon": meal["meal_category_icon"],
                "procedure": meal["procedure"],
                "image": meal["image"],
                "date_time": meal["date_time"],
                "ingredients": [],
                "protein_addons": [],
                "nutrients": {}
            }

        # Match ingredients to their meals
        for ing in ingredients:
            m_id = ing["meal_id"]
            if m_id in meal_map:
                meal_map[m_id]["ingredients"].append({
                    "text": ing["ingredient_text"],
                    "type": ing["ingredient_type"],
                    "grams": float(ing["grams"]),
                    "number": float(ing["number"])
                })

        # Match protein_addons to their meals
        for addon in addons:
            m_id = addon["meal_id"]
            if m_id in meal_map:
                meal_map[m_id]["protein_addons"].append({
                    "text": addon["addon_text"],
                    "type": addon["addon_type"],
                    "grams": float(addon["grams"]),
                    "number": float(addon["number"])
                })

        # Match nutrients to their meals
        for nut in nutrients:
            m_id = nut["meal_id"]
            if m_id in meal_map:
                meal_map[m_id]["nutrients"] = {
                    "calories": float(nut["calories"]),
                    "protein": float(nut["protein"]),
                    "carbs": float(nut["carbs"]),
                    "fat": float(nut["fat"]),
                    "fibre": float(nut["fibre"])
                }

        # Scale each meal’s ingredients and nutrients to the requested portions
        for m_id, meal_obj in meal_map.items():
            base_portions = meal_obj["portions"] or 1
            scale_factor = portions / base_portions

            # Scale ingredient grams/numbers
            for ing in meal_obj["ingredients"]:
                ing["grams"] = round(ing["grams"] * scale_factor, 2)
                ing["number"] = round(ing["number"] * scale_factor, 2)

            # Scale protein_addons grams/numbers
            for addon in meal_obj["protein_addons"]:
                addon["grams"] = round(addon["grams"] * scale_factor, 2)
                addon["number"] = round(addon["number"] * scale_factor, 2)

            # Scale nutrients
            if "calories" in meal_obj["nutrients"]:
                meal_obj["nutrients"]["calories"] = round(meal_obj["nutrients"]["calories"] * scale_factor, 2)
                meal_obj["nutrients"]["protein"] = round(meal_obj["nutrients"]["protein"] * scale_factor, 2)
                meal_obj["nutrients"]["carbs"] = round(meal_obj["nutrients"]["carbs"] * scale_factor, 2)
                meal_obj["nutrients"]["fat"] = round(meal_obj["nutrients"]["fat"] * scale_factor, 2)
                meal_obj["nutrients"]["fibre"] = round(meal_obj["nutrients"]["fibre"] * scale_factor, 2)

            # Finally, override the meal portions count in the result
            meal_obj["portions"] = portions

        # Return as a list of meal objects
        return list(meal_map.values())

    finally:
        cursor.close()
        conn.close()


@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int):
    conn = psycopg2.connect(**DATABASE_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        conn.autocommit = False
        
        # 1) Optionally delete children if you don’t have ON DELETE CASCADE
        cursor.execute("DELETE FROM health_app.meal_ingredients WHERE meal_id = %s;", (meal_id,))
        cursor.execute("DELETE FROM health_app.meal_protein_addons WHERE meal_id = %s;", (meal_id,))
        cursor.execute("DELETE FROM health_app.meal_nutrients WHERE meal_id = %s;", (meal_id,))
        
        # 2) Delete the meal itself
        cursor.execute("DELETE FROM health_app.meals WHERE id = %s RETURNING id;", (meal_id,))
        deleted_row = cursor.fetchone()
        
        if not deleted_row:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Meal not found")
        
        conn.commit()
        return {"message": f"Meal with ID {meal_id} deleted successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.get("/ingredients")
def get_distinct_ingredients():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT DISTINCT ingredient_text
            FROM health_app.meal_ingredients
            ORDER BY ingredient_text DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        # Return a simple list of the distinct ingredient_text values
        return [row["ingredient_text"] for row in rows]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.get("/ingredient_unit")
def get_distinct_ingredients():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT DISTINCT ingredient_type
            FROM health_app.meal_ingredients
            ORDER BY ingredient_type DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        # Return a simple list of the distinct ingredient_type values
        return [row["ingredient_type"] for row in rows]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()