"""
Urban Issues YOLOv8 Classes Specification
Derived from RULES.md Section 6 and main.ipynb
"""

CLASSES = {
    0: {
        "class_id": 0,
        "class_name": "Damaged Road Issues",
        "category": "damaged_road",
        "department": "d_roads",
        "has_road_lookup": True,
        "base_severity": 3,
    },
    1: {
        "class_id": 1,
        "class_name": "Pothole Issues",
        "category": "pothole",
        "department": "d_roads",
        "has_road_lookup": True,
        "base_severity": 3,
    },
    2: {
        "class_id": 2,
        "class_name": "Illegal Parking Issues",
        "category": "illegal_parking",
        "department": "d_traffic",
        "has_road_lookup": False,
        "base_severity": 1,
    },
    3: {
        "class_id": 3,
        "class_name": "Broken Road Sign Issues",
        "category": "broken_road_sign",
        "department": "d_roads",
        "has_road_lookup": True,
        "base_severity": 2,
    },
    4: {
        "class_id": 4,
        "class_name": "Fallen Trees",
        "category": "fallen_tree",
        "department": "d_horticulture",
        "has_road_lookup": False,
        "base_severity": 4,
    },
    5: {
        "class_id": 5,
        "class_name": "Littering/Garbage on Public Places",
        "category": "garbage",
        "department": "d_sanitation",
        "has_road_lookup": False,
        "base_severity": 2,
    },
    6: {
        "class_id": 6,
        "class_name": "Vandalism Issues",
        "category": "vandalism",
        "department": "d_enforcement",
        "has_road_lookup": False,
        "base_severity": 1,
    },
    7: {
        "class_id": 7,
        "class_name": "Dead Animal Pollution",
        "category": "dead_animal",
        "department": "d_sanitation",
        "has_road_lookup": False,
        "base_severity": 3,
    },
    8: {
        "class_id": 8,
        "class_name": "Damaged Concrete Structures",
        "category": "damaged_concrete",
        "department": "d_roads",
        "has_road_lookup": True,
        "base_severity": 4,
    },
    9: {
        "class_id": 9,
        "class_name": "Damaged Electric Wires and Poles",
        "category": "electric_hazard",
        "department": "d_electricity",
        "has_road_lookup": False,
        "base_severity": 5,
    },
}

CLASS_NAMES = [CLASSES[i]["class_name"] for i in range(len(CLASSES))]
