import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A department store / mall: departments, tills, storeroom, parking. */
export const SHOP_THEME: SceneTheme = {
  id: 'shop',
  name: 'Store and shopping mall',
  nameNl: 'Winkel en winkelcentrum',
  rooms: [
    { name: 'Checkout', nameNl: 'Kassa', favours: ['checkoutCounter', 'adScreen', 'fittingStool'] },
    { name: 'Warehouse', nameNl: 'Magazijn', favours: ['shelf', 'crates', 'deliveryVan'] },
    { name: 'Fitting Rooms', nameNl: 'Paskamers', favours: ['fittingStool', 'clothesRack', 'showroomRug'] },
    { name: 'Window Display', nameNl: 'Etalage', favours: ['mannequin', 'displayTable', 'houseplant'] },
    { name: 'Menswear Department', nameNl: 'Herenmode', favours: ['clothesRack', 'mannequin', 'fittingStool'] },
    { name: 'Womenswear Department', nameNl: 'Damesmode', favours: ['clothesRack', 'mannequin', 'poof'] },
    { name: 'Kids Department', nameNl: 'Kinderafdeling', favours: ['clothesRack', 'poof', 'shelf'] },
    { name: 'Electronics Department', nameNl: 'Elektronica-afdeling', favours: ['displayCase', 'adScreen', 'displayTable'] },
    { name: 'Toy Department', nameNl: 'Speelgoedafdeling', favours: ['shelf', 'poof', 'crates'] },
    { name: 'Book Department', nameNl: 'Boekenafdeling', favours: ['shelf', 'displayTable', 'waitingSofa'] },
    { name: 'Office', nameNl: 'Kantoor', favours: ['displayTable', 'displayCase', 'fittingStool'] },
    { name: 'Staff Room', nameNl: 'Personeelskamer', favours: ['waitingSofa', 'vendingMachine', 'fittingStool'] },
    { name: 'Restaurant', nameNl: 'Restaurant', favours: ['displayTable', 'fittingStool', 'vendingMachine'] },
    { name: 'Entrance', nameNl: 'Entree', favours: ['houseplant', 'runner'] },
    { name: 'Parking Garage', nameNl: 'Parkeergarage', favours: ['deliveryVan', 'crates'] },
    { name: 'Collection Point', nameNl: 'Afhaalpunt', favours: ['checkoutCounter', 'shelf', 'fittingStool'] },
    { name: 'Home Department', nameNl: 'Woonafdeling', favours: ['showroomBed', 'showroomCornerSofa', 'showroomRug'] },
    { name: 'Bedroom Department', nameNl: 'Slaapkamerafdeling', favours: ['showroomBed', 'showroomRug', 'displayCase'] },
    { name: 'Produce Department', nameNl: 'Verse producten', favours: ['shelf', 'crates', 'houseplant'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'fittingStool', name: 'fitting stool', engineType: 'chair', weight: 8, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'poof', name: 'poof', engineType: 'chair', themeIcon: 'beanbag', weight: 2, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'waitingSofa', name: 'waiting sofa', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'showroomCornerSofa', name: 'showroom corner sofa', engineType: 'sofa', weight: 1, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1 }),
    themeObject({ kind: 'runner', name: 'runner', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(1, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'showroomRug', name: 'showroom rug', engineType: 'rug', weight: 2, footprints: [rect(2, 2), rect(2, 1)], placement: 'centre', maxPerRoom: 1 }),
    themeObject({ kind: 'showroomBed', name: 'showroom bed', engineType: 'bed', weight: 1, footprints: [rect(1, 2), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'deliveryVan', name: 'delivery van', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2 }),
    // Blocking
    themeObject({ kind: 'checkoutCounter', name: 'checkout counter', engineType: 'kitchenCounter', themeIcon: 'checkoutCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'shelf', name: 'shelf', engineType: 'bookshelf', weight: 10, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall' }),
    themeObject({ kind: 'displayCase', name: 'display case', engineType: 'cabinet', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall' }),
    themeObject({ kind: 'clothesRack', name: 'clothes rack', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 6, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'mannequin', name: 'mannequin', engineType: 'statue', themeIcon: 'mannequin', weight: 3, footprints: [rect(1, 1)], placement: 'anywhere' }),
    themeObject({ kind: 'displayTable', name: 'display table', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre' }),
    themeObject({ kind: 'houseplant', name: 'houseplant', engineType: 'plant', weight: 3, footprints: [rect(1, 1)], placement: 'corner' }),
    themeObject({ kind: 'adScreen', name: 'advertising screen', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2 }),
    themeObject({ kind: 'crates', name: 'crates', clueNoun: 'crate', engineType: 'chest', weight: 3, footprints: [rect(1, 1)], placement: 'wall' }),
    themeObject({ kind: 'vendingMachine', name: 'vending machine', engineType: 'cabinet', themeIcon: 'vendingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1 }),
  ],
}
