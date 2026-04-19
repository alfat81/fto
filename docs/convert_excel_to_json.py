import pandas as pd
import json
import os

# Чтение Excel файла
df = pd.read_excel('Кресла стулья.xlsx', sheet_name='Лист2')

# Создаем папку для товаров
os.makedirs('data/products', exist_ok=True)

products_index = []

for index, row in df.iterrows():
    # Создаем объект товара
    product = {
        "id": row.get('Код товара', f'4.{index+1}'),
        "category": 4,  # Кресла и стулья
        "name": row.get('Название товара', ''),
        "price": int(row.get('Цена товара', 0)),
        "description": f"{row.get('Общие характеристики', '')} {row.get('Основные характеристики', '')}",
        "specs": {
            "Артикул": str(row.get('Артикул', '')),
            "Цвет": str(row.get('Цвет', '')),
            "Страна производитель": str(row.get('Страна производитель', '')),
            "Гарантия": str(row.get('Гарантия', '')),
            "Вес, кг": str(row.get('Вес, кг', '')),
            "Ширина, мм": str(row.get('Ширина, мм', '')),
            "Высота max, мм": str(row.get('Высота max, мм', '')),
            "Высота сиденья max, мм": str(row.get('Высота сиденья max, мм', '')),
        }
    }
    
    # Сохраняем в отдельный файл
    filename = f"{product['id']}.json"
    filepath = f"data/products/{filename}"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(product, f, ensure_ascii=False, indent=2)
    
    products_index.append(filename)
    print(f"✓ Создан: {filename}")

# Создаем index.json
with open('data/products/index.json', 'w', encoding='utf-8') as f:
    json.dump(products_index, f, ensure_ascii=False, indent=2)

print(f"\n✓ Всего создано: {len(products_index)} товаров")