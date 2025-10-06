from fastapi import FastAPI, Path
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


@app.get("/restaurants/{id}")
async def get_a_single_restaurant(
    id: str = Path(..., description="restaurant id chahincha hai", example="R001")
):
    data = load_json()
    if id in data:
        return data[id]
    raise HTTPException(status_code=404, detail="Patient not found")
