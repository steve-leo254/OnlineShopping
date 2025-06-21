/**
 * Utility functions for handling product specifications
 */

export interface ProductSpecification {
    id: number;
    product_id: number;
    specification_id: number;
    value: string;
    specification?: {
        id: number;
        name: string;
        value_type: string;
        category_id: number;
    };
}

/**
 * Format product specifications to a string for UI display
 * @param specifications - Array of product specifications
 * @returns Formatted string of specifications
 */
export const formatSpecificationsToString = (specifications: ProductSpecification[]): string => {
    if (!specifications || specifications.length === 0) {
        return "";
    }

    const specParts = specifications
        .filter(spec => spec.specification && spec.value)
        .map(spec => `${spec.specification!.name}: ${spec.value}`);

    return specParts.join(", ");
};

/**
 * Format specifications for detailed product view (key-value pairs)
 * @param specifications - Array of product specifications
 * @returns Array of formatted specification objects
 */
export const formatSpecificationsForDetail = (specifications: ProductSpecification[]) => {
    if (!specifications || specifications.length === 0) {
        return [];
    }

    return specifications
        .filter(spec => spec.specification && spec.value)
        .map(spec => ({
            name: spec.specification!.name,
            value: spec.value,
            type: spec.specification!.value_type
        }));
};

/**
 * Get specifications by category
 * @param specifications - Array of product specifications
 * @param categoryName - Category name to filter by
 * @returns Filtered specifications
 */
export const getSpecificationsByCategory = (
    specifications: ProductSpecification[],
    categoryName: string
) => {
    return specifications.filter(spec =>
        spec.specification &&
        spec.specification.name.toLowerCase().includes(categoryName.toLowerCase())
    );
}; 