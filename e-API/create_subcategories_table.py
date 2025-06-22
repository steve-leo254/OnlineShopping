#!/usr/bin/env python3
"""
Database migration script to add subcategories table
Run this script to create the subcategories table in your existing database
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


def create_subcategories_table():
    """Create the subcategories table"""
    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as connection:
            # Check if subcategories table already exists
            result = connection.execute(
                text(
                    """
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'subcategories'
            """
                )
            )

            if result.scalar() > 0:
                print("✅ Subcategories table already exists!")
                return

            # Create subcategories table
            connection.execute(
                text(
                    """
                CREATE TABLE subcategories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description VARCHAR(200),
                    category_id INT NOT NULL,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                    INDEX idx_category_id (category_id)
                )
            """
                )
            )

            # Add subcategory_id column to products table if it doesn't exist
            result = connection.execute(
                text(
                    """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'products' 
                AND column_name = 'subcategory_id'
            """
                )
            )

            if result.scalar() == 0:
                connection.execute(
                    text(
                        """
                    ALTER TABLE products 
                    ADD COLUMN subcategory_id INT,
                    ADD FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
                    ADD INDEX idx_subcategory_id (subcategory_id)
                """
                    )
                )
                print("✅ Added subcategory_id column to products table")

            connection.commit()
            print("✅ Subcategories table created successfully!")

    except SQLAlchemyError as e:
        print(f"❌ Error creating subcategories table: {e}")
        sys.exit(1)


def insert_sample_subcategories():
    """Insert sample subcategories for testing"""
    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as connection:
            # Get existing categories
            categories = connection.execute(
                text("SELECT id, name FROM categories")
            ).fetchall()

            if not categories:
                print("⚠️  No categories found. Please create categories first.")
                return

            # Sample subcategories data
            sample_subcategories = [
                # Electronics subcategories
                (
                    "Gaming Laptops",
                    "High-performance laptops for gaming",
                    "Electronics",
                ),
                ("Business Laptops", "Professional laptops for work", "Electronics"),
                ("Ultrabooks", "Lightweight and portable laptops", "Electronics"),
                ("Smartphones", "Mobile phones and devices", "Electronics"),
                ("Tablets", "Portable computing devices", "Electronics"),
                (
                    "Audio & Headphones",
                    "Sound equipment and accessories",
                    "Electronics",
                ),
                ("Keyboards & Mice", "Input devices and accessories", "Electronics"),
                ("Monitors & Displays", "Computer displays and screens", "Electronics"),
                # Fashion subcategories
                ("Men's Clothing", "Clothing for men", "Fashion"),
                ("Women's Clothing", "Clothing for women", "Fashion"),
                ("Kids' Clothing", "Clothing for children", "Fashion"),
                ("Shoes", "Footwear for all ages", "Fashion"),
                ("Accessories", "Fashion accessories", "Fashion"),
                # Home & Garden subcategories
                ("Furniture", "Home and office furniture", "Home & Garden"),
                (
                    "Kitchen & Dining",
                    "Kitchen appliances and dining items",
                    "Home & Garden",
                ),
                ("Bedding", "Bed sheets, pillows, and bedding", "Home & Garden"),
                ("Decor", "Home decoration items", "Home & Garden"),
                ("Garden Tools", "Tools for gardening", "Home & Garden"),
                # Sports subcategories
                ("Fitness Equipment", "Exercise and fitness equipment", "Sports"),
                ("Team Sports", "Equipment for team sports", "Sports"),
                ("Outdoor Sports", "Equipment for outdoor activities", "Sports"),
                ("Athletic Wear", "Sports clothing and gear", "Sports"),
                # Books subcategories
                ("Fiction", "Fictional literature", "Books"),
                ("Non-Fiction", "Non-fictional books", "Books"),
                ("Educational", "Educational and academic books", "Books"),
                ("Children's Books", "Books for children", "Books"),
                # Beauty subcategories
                ("Skincare", "Skin care products", "Beauty"),
                ("Makeup", "Cosmetics and makeup", "Beauty"),
                ("Hair Care", "Hair care products", "Beauty"),
                ("Fragrances", "Perfumes and fragrances", "Beauty"),
            ]

            # Insert subcategories
            for name, description, category_name in sample_subcategories:
                # Find category ID
                category = next(
                    (
                        cat
                        for cat in categories
                        if cat.name.lower() == category_name.lower()
                    ),
                    None,
                )
                if category:
                    # Check if subcategory already exists
                    existing = connection.execute(
                        text(
                            """
                        SELECT id FROM subcategories 
                        WHERE name = :name AND category_id = :category_id
                    """
                        ),
                        {"name": name, "category_id": category.id},
                    ).fetchone()

                    if not existing:
                        connection.execute(
                            text(
                                """
                            INSERT INTO subcategories (name, description, category_id)
                            VALUES (:name, :description, :category_id)
                        """
                            ),
                            {
                                "name": name,
                                "description": description,
                                "category_id": category.id,
                            },
                        )
                        print(
                            f"✅ Added subcategory: {name} (Category: {category_name})"
                        )
                    else:
                        print(f"⚠️  Subcategory already exists: {name}")
                else:
                    print(f"⚠️  Category not found: {category_name}")

            connection.commit()
            print("✅ Sample subcategories inserted successfully!")

    except SQLAlchemyError as e:
        print(f"❌ Error inserting sample subcategories: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("🚀 Starting subcategories table migration...")
    create_subcategories_table()

    print("\n🌱 Inserting sample subcategories...")
    insert_sample_subcategories()

    print("\n✅ Migration completed successfully!")
    print("\n📋 Next steps:")
    print("1. Test the API endpoints for subcategories")
    print("2. Update your frontend to use the new subcategory structure")
    print(
        "3. Update AddProduct and UpdateProduct components to include subcategory selection"
    )
