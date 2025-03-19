from pydantic import BaseModel
from datetime import date
from typing import List


class Ingredient(BaseModel):
    text: str
    type: str
    grams: float
    number: float

class ProteinAddon(BaseModel):
    text: str
    type: str
    grams: float
    number: float

class Nutrients(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fibre: float

class Meal(BaseModel):
    name: str
    rating: int
    portions: int
    protein_powder: bool
    heatable: bool
    must_be_heated: bool
    meal_type: List[int]
    meal_category: List[str]
    meal_category_icon: str
    procedure: str
    image: str
    date_time: str

    ingredients: List[Ingredient]
    protein_addons: List[ProteinAddon]
    nutrients: Nutrients