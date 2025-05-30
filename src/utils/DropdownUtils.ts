import { DropdownOption } from '@/components/ui/Dropdown';

export const createDropdownOptions = <T>(
    items: T[],
    valueKey: keyof T,
    labelKey: keyof T,
    options?: {
        includeEmpty?: { value: string | number; label: string };
        transform?: (item: T) => Partial<DropdownOption>;
    }
): DropdownOption[] => {
    const dropdownOptions: DropdownOption[] = items.map(item => ({
        value: item[valueKey] as string | number,
        label: String(item[labelKey]),
        ...options?.transform?.(item)
    }));

    if (options?.includeEmpty) {
        return [options.includeEmpty, ...dropdownOptions];
    }

    return dropdownOptions;
};

export const WALL_SIDE_OPTIONS: DropdownOption[] = [
    { value: 1, label: 'Bottom' },
    { value: 2, label: 'Left' },
    { value: 3, label: 'Top' },
    { value: 4, label: 'Right' }
];

export const BOOLEAN_OPTIONS: DropdownOption[] = [
    { value: 1, label: 'Yes' },
    { value: 2, label: 'No' }
];
