import uuid
from datetime import datetime

# Official administrative hierarchies template
HIERARCHIES = [
    ("Telangana", "Hyderabad", "Hyderabad North", "Shaikpet", "Municipal Corporation", "GHMC", "Ward 95 - Jubilee Hills"),
    ("Telangana", "Hyderabad", "Hyderabad North", "Shaikpet", "Municipal Corporation", "GHMC", "Ward 94 - Banjara Hills"),
    ("Telangana", "Hyderabad", "Hyderabad South", "Charminar", "Municipal Corporation", "GHMC", "Ward 52 - Moghalpura"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Serilingampally", "Municipal Corporation", "GHMC", "Ward 105 - Gachibowli"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Serilingampally", "Municipal Corporation", "GHMC", "Ward 106 - Kondapur"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Gandipet", "Municipality", "Narsingi Municipality", "Narsingi Village"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Gandipet", "Gram Panchayat", "Kokapet Gram Panchayat", "Kokapet Locality"),
    ("Telangana", "Medchal-Malkajgiri", "Malkajgiri", "Quthbullapur", "Municipal Corporation", "GHMC", "Ward 125 - Quthbullapur"),
    ("Telangana", "Medchal-Malkajgiri", "Malkajgiri", "Alwal", "Municipal Corporation", "GHMC", "Ward 133 - Alwal"),
    ("Telangana", "Medchal-Malkajgiri", "Keesara", "Kapra", "Municipal Corporation", "GHMC", "Ward 1 - Kapra"),
    ("Telangana", "Sangareddy", "Sangareddy", "Patancheru", "Municipality", "Tellapur Municipality", "Osman Nagar"),
    ("Andhra Pradesh", "Visakhapatnam", "Visakhapatnam", "Gajuwaka", "Municipal Corporation", "GVMC", "Ward 65 - Gajuwaka"),
    ("Andhra Pradesh", "Visakhapatnam", "Bheemunipatnam", "Bheemili", "Municipal Corporation", "GVMC", "Ward 12 - Bheemili"),
    ("Andhra Pradesh", "Krishna", "Vijayawada", "Vijayawada Urban", "Municipal Corporation", "VMC", "Ward 32 - Moghalrajpuram"),
    ("Andhra Pradesh", "Krishna", "Vijayawada", "Penamaluru", "Gram Panchayat", "Poranki Gram Panchayat", "Poranki Village")
]

# Hardcoded schools removed: schools are populated exclusively via live AI scraping or user input
SCHOOL_NAMES = []

def generate_sample_schools():
    """Returns an empty list as hardcoded schools have been completely removed."""
    return []

def seed_database(db):
    col = db.collection("schools")
    existing = list(col.stream())
    print(f"Database contains {len(existing)} real schools.")
    return len(existing)

if __name__ == "__main__":
    from firebase_config import get_db
    seed_database(get_db())
