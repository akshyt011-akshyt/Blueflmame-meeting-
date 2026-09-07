import { LearningMaterial } from '../types';

export const PRESET_MATERIALS: LearningMaterial[] = [
  {
    id: 'mat-heart',
    title: 'Biology: Human Heart Anatomy & Circulation',
    type: 'diagram',
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    description: 'Detailed anatomical structure of heart chambers, vena cava, aorta, and systemic blood circulation pathway.'
  },
  {
    id: 'mat-solar',
    title: 'Astronomy: Solar System Planetary Orbits',
    type: 'diagram',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    description: 'Planetary layout illustrating relative distances, celestial orbital dynamics, and inner vs outer planets.'
  },
  {
    id: 'mat-world',
    title: 'Geography: Global Tectonic Plates & Topography',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80',
    description: 'Cartographic projection demonstrating plate boundaries, oceanic trenches, and mountain building.'
  },
  {
    id: 'mat-formulas',
    title: 'Mathematics: Calculus & Linear Algebra Formulas',
    type: 'formula',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    description: 'Fundamental theorem of calculus, matrix eigenvalue transformations, and gradient vector fields.'
  },
  {
    id: 'mat-chemistry',
    title: 'Chemistry: Molecular Geometry & Periodic Bonds',
    type: 'slide',
    url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80',
    description: 'Covalent and ionic bonding orbital models with hybridization states and electronegativity gradients.'
  }
];
