#!/usr/bin/env python3
"""
Script to add initial categories to the database
Run this script to populate your database with sample categories
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection - match the format from database.py
password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME", "ecommerce")
db_host = os.getenv("DB_HOST", "localhost")
DATABASE_URL = f"mysql+pymysql://root:{password}@{db_host}:3306/{db_name}"


def add_initial_categories():
    """Add initial categories to the database"""
    engine = create_engine(DATABASE_URL)

    # Sample categories data
    categories = [
        {
            "name": "Electronics",
            "description": "Electronic devices, gadgets, and accessories including computers, phones, tablets, and audio equipment.",
        },
        {
            "name": "Fashion",
            "description": "Clothing, footwear, and fashion accessories for men, women, and children.",
        },
        {
            "name": "Home & Garden",
            "description": "Furniture, home decor, kitchen appliances, and garden tools for your living space.",
        },
        {
            "name": "Sports & Outdoors",
            "description": "Sports equipment, fitness gear, outdoor activities, and athletic wear.",
        },
        {
            "name": "Books & Media",
            "description": "Books, magazines, digital media, and educational materials.",
        },
        {
            "name": "Beauty & Health",
            "description": "Beauty products, skincare, makeup, health supplements, and personal care items.",
        },
        {
            "name": "Automotive",
            "description": "Car parts, accessories, tools, and automotive maintenance products.",
        },
        {
            "name": "Toys & Games",
            "description": "Toys, board games, video games, and entertainment products for all ages.",
        },
    ]

    try:
        with engine.connect() as connection:
            print("🚀 Adding initial categories...")

            for category in categories:
                # Check if category already exists
                existing = connection.execute(
                    text(
                        """
                    SELECT id FROM categories WHERE name = :name
                """
                    ),
                    {"name": category["name"]},
                ).fetchone()

                if existing:
                    print(f"⚠️  Category already exists: {category['name']}")
                else:
                    # Insert category
                    result = connection.execute(
                        text(
                            """
                        INSERT INTO categories (name, description)
                        VALUES (:name, :description)
                    """
                        ),
                        category,
                    )

                    category_id = result.lastrowid
                    print(f"✅ Added category: {category['name']} (ID: {category_id})")

            connection.commit()
            print("\n✅ All categories added successfully!")

            # Show summary
            total_categories = connection.execute(
                text("SELECT COUNT(*) FROM categories")
            ).scalar()
            print(f"\n📊 Total categories in database: {total_categories}")

    except SQLAlchemyError as e:
        print(f"❌ Error adding categories: {e}")
        sys.exit(1)


def add_sample_subcategories():
    """Add sample subcategories for the categories"""
    engine = create_engine(DATABASE_URL)

    # Sample subcategories data
    subcategories = [
        # Electronics subcategories
        ("Electronics", "Laptops", "High-performance laptops for work and gaming"),
        ("Electronics", "Smartphones", "Mobile phones and devices"),
        ("Electronics", "Tablets", "Portable computing devices"),
        ("Electronics", "Audio & Headphones", "Sound equipment and accessories"),
        ("Electronics", "Keyboards & Mice", "Input devices and accessories"),
        ("Electronics", "Monitors & Displays", "Computer displays and screens"),
        ("Electronics", "Gaming", "Gaming consoles and accessories"),
        ("Electronics", "Cameras", "Digital cameras and photography equipment"),
        # Fashion subcategories
        ("Fashion", "Men's Clothing", "Clothing for men"),
        ("Fashion", "Women's Clothing", "Clothing for women"),
        ("Fashion", "Kids' Clothing", "Clothing for children"),
        ("Fashion", "Shoes", "Footwear for all ages"),
        ("Fashion", "Accessories", "Fashion accessories and jewelry"),
        ("Fashion", "Bags & Wallets", "Handbags, backpacks, and wallets"),
        ("Fashion", "Watches", "Wristwatches and timepieces"),
        # Home & Garden subcategories
        ("Home & Garden", "Furniture", "Home and office furniture"),
        ("Home & Garden", "Kitchen & Dining", "Kitchen appliances and dining items"),
        ("Home & Garden", "Bedding", "Bed sheets, pillows, and bedding"),
        ("Home & Garden", "Decor", "Home decoration items"),
        ("Home & Garden", "Garden Tools", "Tools for gardening"),
        ("Home & Garden", "Lighting", "Home lighting fixtures"),
        ("Home & Garden", "Storage", "Storage solutions and organizers"),
        # Sports & Outdoors subcategories
        ("Sports & Outdoors", "Fitness Equipment", "Exercise and fitness equipment"),
        ("Sports & Outdoors", "Team Sports", "Equipment for team sports"),
        ("Sports & Outdoors", "Outdoor Sports", "Equipment for outdoor activities"),
        ("Sports & Outdoors", "Athletic Wear", "Sports clothing and gear"),
        ("Sports & Outdoors", "Camping", "Camping gear and equipment"),
        ("Sports & Outdoors", "Cycling", "Bicycles and cycling accessories"),
        # Books & Media subcategories
        ("Books & Media", "Fiction", "Fictional literature"),
        ("Books & Media", "Non-Fiction", "Non-fictional books"),
        ("Books & Media", "Educational", "Educational and academic books"),
        ("Books & Media", "Children's Books", "Books for children"),
        ("Books & Media", "Magazines", "Periodicals and magazines"),
        ("Books & Media", "Digital Media", "E-books and digital content"),
        # Beauty & Health subcategories
        ("Beauty & Health", "Skincare", "Skin care products"),
        ("Beauty & Health", "Makeup", "Cosmetics and makeup"),
        ("Beauty & Health", "Hair Care", "Hair care products"),
        ("Beauty & Health", "Fragrances", "Perfumes and fragrances"),
        ("Beauty & Health", "Health Supplements", "Vitamins and supplements"),
        ("Beauty & Health", "Personal Care", "Personal hygiene products"),
        # Automotive subcategories
        ("Automotive", "Car Parts", "Automotive parts and components"),
        ("Automotive", "Accessories", "Car accessories and modifications"),
        ("Automotive", "Tools", "Automotive tools and equipment"),
        ("Automotive", "Maintenance", "Car maintenance products"),
        ("Automotive", "Motorcycle", "Motorcycle parts and accessories"),
        # Toys & Games subcategories
        ("Toys & Games", "Board Games", "Traditional board games"),
        ("Toys & Games", "Video Games", "Video games and consoles"),
        ("Toys & Games", "Educational Toys", "Learning and educational toys"),
        ("Toys & Games", "Action Figures", "Action figures and collectibles"),
        ("Toys & Games", "Puzzles", "Jigsaw puzzles and brain teasers"),
        ("Toys & Games", "Outdoor Toys", "Outdoor play equipment"),
    ]

    try:
        with engine.connect() as connection:
            print("\n🌱 Adding sample subcategories...")

            for category_name, subcategory_name, description in subcategories:
                # Get category ID
                category = connection.execute(
                    text(
                        """
                    SELECT id FROM categories WHERE name = :name
                """
                    ),
                    {"name": category_name},
                ).fetchone()

                if not category:
                    print(f"⚠️  Category not found: {category_name}")
                    continue

                # Check if subcategory already exists
                existing = connection.execute(
                    text(
                        """
                    SELECT id FROM subcategories 
                    WHERE name = :name AND category_id = :category_id
                """
                    ),
                    {"name": subcategory_name, "category_id": category.id},
                ).fetchone()

                if existing:
                    print(
                        f"⚠️  Subcategory already exists: {subcategory_name} (Category: {category_name})"
                    )
                else:
                    # Insert subcategory
                    result = connection.execute(
                        text(
                            """
                        INSERT INTO subcategories (name, description, category_id)
                        VALUES (:name, :description, :category_id)
                    """
                        ),
                        {
                            "name": subcategory_name,
                            "description": description,
                            "category_id": category.id,
                        },
                    )

                    subcategory_id = result.lastrowid
                    print(
                        f"✅ Added subcategory: {subcategory_name} (Category: {category_name}, ID: {subcategory_id})"
                    )

            connection.commit()
            print("\n✅ All subcategories added successfully!")

            # Show summary
            total_subcategories = connection.execute(
                text("SELECT COUNT(*) FROM subcategories")
            ).scalar()
            print(f"\n📊 Total subcategories in database: {total_subcategories}")

    except SQLAlchemyError as e:
        print(f"❌ Error adding subcategories: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("🚀 Starting database population...")
    add_initial_categories()
    add_sample_subcategories()

    print("\n✅ Database population completed successfully!")
    print("\n📋 Next steps:")
    print("1. Test the category and subcategory API endpoints")
    print("2. Update your frontend components to use the new data")
    print("3. Create the subcategory management component")
