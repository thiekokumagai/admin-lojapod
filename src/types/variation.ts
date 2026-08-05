export type VariationOption = {
  id: string;
  value: string;
};

export type Variation = {
  id: string;
  title: string;
  options: VariationOption[];
};

export type VariationFormValues = {
  title: string;
  options: string[];
};