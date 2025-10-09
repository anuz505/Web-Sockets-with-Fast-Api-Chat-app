from pydantic import BaseModel, Field, computed_field
from typing import Literal


class Restaurant(BaseModel):
    # name: Annotated[
    #     str,
    #     Field(..., description="Name of the restaurant", examples=["Spice Garden"]),
    # ]
    id: str = Field(
        ..., description="Restaurant ID", examples=["R001"], pattern="^R\\d{3}$"
    )

    name: str = (
        (Field(..., description="Name of the restaurant", examples=["Spice Garden"]),),
    )
    city: str = Field(
        ..., description="Name of the city", examples=["kathmandu"], max_length=50
    )
    cuisine: str = Field(..., description="cuisne", examples=["nepali"])
    rating: float = Field(
        ..., description="rating from 0 to 5", examples=[4.5], ge=0, le=5
    )
    price_range: Literal["$", "$$", "$$$", "$$$$"] = Field(
        ..., description="Price range"
    )
    seating_capacity: int = Field(
        ..., description="number of seating capacity", examples=[50], ge=1, le=5000
    )
    established_year: int = Field(..., ge=1900, le=2025, description="Year established")
    category: str = Field(..., description="Restaurant category")

    @computed_field
    @property
    def price_score(self) -> int:
        price_score = len(self.price_range)
        return price_score

    @computed_field
    @property
    def popularity_score(self) -> float:
        score = (self.rating * self.seating_capacity) / self.price_score
        return score

    @computed_field
    @property
    def verdict(self) -> str:
        if self.popularity_score >= 200:
            return "Highly Popular"
        elif self.popularity_score >= 150:
            return "Very Popular"
        elif self.popularity_score >= 100:
            return "Popular"
        elif self.popularity_score >= 50:
            return "Moderately Popular"
        else:
            return "Less Popular"

    class Config:
        json_schema_extra = {
            "Example": {
                "id": "R008",
                "name": "Spice Garden",
                "city": "Mumbai",
                "cuisine": "Indian",
                "rating": 4.5,
                "price_range": "$$",
                "seating_capacity": 80,
                "established_year": 2015,
                "category": "Fine Dining",
            }
        }
