from fastapi import FastAPI, Path, Query
import json
from fastapi.exceptions import HTTPException

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "hello this is fast API"}


def load_json():
    with open("restaurant.json", "r") as f:
        data = json.load(f)
    return data


@app.get("/restaurants")
async def get_restaurants():
    return load_json()


@app.get("/restaurants/sorted")
async def sortbyrating(
    sortby: str = Query(..., description="sort by rating", example="rating"),
    order: bool = (
        Query(description="order accending or decending", example="accending")
    ),
):

    data = load_json()
    restaurants_list = [(k, v) for k, v in data.items()]
    sorted_data = sorted(
        restaurants_list, key=lambda x: x[1].get(sortby, 0), reverse=order
    )
    return {k: v for k, v in sorted_data}


@app.get("/restaurants/{id}")
async def get_a_single_restaurant(
    id: str = Path(..., description="restaurant id chahincha hai", example="R001")
):
    data = load_json()
    if id in data:
        return data[id]
    raise HTTPException(status_code=404, detail="Restaurant not found")
