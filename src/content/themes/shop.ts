import { lShape, rect, themeObject } from './define.ts'
import type { SceneTheme } from './types.ts'

/** A department store / mall: departments, tills, storeroom, parking. Room rules: docs/authoring/room-rules.md. */
export const SHOP_THEME: SceneTheme = {
  id: 'shop',
  name: 'Store and shopping mall',
  nameNl: 'Winkel en winkelcentrum',
  rooms: [
    { name: 'Checkout', nameNl: 'Kassa', favours: ['checkoutCounter', 'adScreen', 'fittingStool'], roomTypes: ['checkout'] },
    { name: 'Warehouse', nameNl: 'Magazijn', favours: ['shelf', 'crates'], roomTypes: ['storage'] },
    { name: 'Fitting Rooms', nameNl: 'Paskamers', favours: ['fittingStool', 'clothesRack', 'showroomRug'], roomTypes: ['fitting'] },
    { name: 'Window Display', nameNl: 'Etalage', favours: ['mannequin', 'displayTable', 'houseplant'], roomTypes: ['retail'] },
    { name: 'Menswear Department', nameNl: 'Herenmode', favours: ['clothesRack', 'mannequin', 'fittingStool'], roomTypes: ['retail'] },
    { name: 'Womenswear Department', nameNl: 'Damesmode', favours: ['clothesRack', 'mannequin', 'fittingStool'], roomTypes: ['retail'] },
    { name: 'Kids Department', nameNl: 'Kinderafdeling', favours: ['clothesRack', 'fittingStool', 'shelf'], roomTypes: ['retail'] },
    { name: 'Electronics Department', nameNl: 'Elektronica-afdeling', favours: ['displayCase', 'adScreen', 'displayTable'], roomTypes: ['retail'] },
    { name: 'Toy Department', nameNl: 'Speelgoedafdeling', favours: ['shelf', 'fittingStool', 'crates'], roomTypes: ['retail'] },
    { name: 'Book Department', nameNl: 'Boekenafdeling', favours: ['shelf', 'displayTable', 'waitingSofa'], roomTypes: ['retail'] },
    { name: 'Office', nameNl: 'Kantoor', favours: ['crates', 'shelf', 'fittingStool'], roomTypes: ['storage', 'living'] },
    { name: 'Staff Room', nameNl: 'Personeelskamer', favours: ['waitingSofa', 'vendingMachine', 'fittingStool'], roomTypes: ['living', 'kitchen'] },
    { name: 'Restaurant', nameNl: 'Restaurant', favours: ['displayTable', 'fittingStool', 'vendingMachine'], roomTypes: ['dining', 'kitchen'] },
    { name: 'Entrance', nameNl: 'Entree', favours: ['houseplant', 'runner'], roomTypes: ['circulation'] },
    { name: 'Parking Garage', nameNl: 'Parkeergarage', favours: ['deliveryVan'], roomTypes: ['garage'] },
    { name: 'Collection Point', nameNl: 'Afhaalpunt', favours: ['checkoutCounter', 'shelf', 'fittingStool'], roomTypes: ['checkout', 'retail'] },
    { name: 'Home Department', nameNl: 'Woonafdeling', favours: ['showroomBed', 'showroomCornerSofa', 'showroomRug'], roomTypes: ['sleeping', 'retail'] },
    { name: 'Bedroom Department', nameNl: 'Slaapkamerafdeling', favours: ['showroomBed', 'showroomRug', 'displayCase'], roomTypes: ['sleeping', 'retail'] },
    { name: 'Produce Department', nameNl: 'Verse producten', favours: ['shelf', 'crates', 'houseplant'], roomTypes: ['retail'] },
    { name: 'Loading Bay', nameNl: 'Laadperron', favours: ['deliveryVan', 'crates'], roomTypes: ['garage', 'storage'] },
    { name: 'Self Checkout', nameNl: 'Zelfscankassa', favours: ['checkoutCounter', 'adScreen'], roomTypes: ['checkout'] },
    { name: 'Shoe Department', nameNl: 'Schoenenafdeling', favours: ['fittingStool', 'shelf', 'displayTable'], roomTypes: ['retail', 'fitting'] },
  ],
  objects: [
    // Occupiable
    themeObject({ kind: 'fittingStool', name: 'fitting stool', nameNl: 'paskruk', engineType: 'chair', weight: 2, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['fitting', 'retail', 'checkout', 'living', 'dining'] }),
    themeObject({ kind: 'waitingSofa', name: 'waiting sofa', nameNl: 'wachtbank', engineType: 'sofa', weight: 3, footprints: [rect(2, 1), rect(3, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['living', 'retail'] }),
    themeObject({ kind: 'showroomCornerSofa', name: 'showroom corner sofa', nameNl: 'showroomhoekbank', engineType: 'sofa', weight: 1, footprints: [lShape(2), lShape(3, 0.5)], placement: 'corner', maxPerRoom: 1, allowedRoomTypes: ['retail', 'living'] }),
    themeObject({ kind: 'runner', name: 'runner', nameNl: 'loper', engineType: 'rug', weight: 3, footprints: [rect(2, 1), rect(1, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['circulation', 'retail'] }),
    themeObject({ kind: 'showroomRug', name: 'showroom rug', nameNl: 'showroomkleed', engineType: 'rug', weight: 3, footprints: [rect(2, 2), rect(2, 1)], placement: 'centre', maxPerRoom: 1, allowedRoomTypes: ['retail', 'fitting'] }),
    themeObject({ kind: 'showroomBed', name: 'showroom bed', nameNl: 'showroombed', engineType: 'bed', weight: 1, footprints: [rect(1, 2), rect(2, 2, 0.5)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['sleeping'] }),
    themeObject({ kind: 'deliveryVan', name: 'delivery van', nameNl: 'bestelbus', engineType: 'car', weight: 1, footprints: [rect(1, 2)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['garage'] }),
    // Blocking
    themeObject({ kind: 'checkoutCounter', name: 'checkout counter', nameNl: 'kassa', engineType: 'kitchenCounter', themeIcon: 'checkoutCounter', weight: 3, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['checkout'] }),
    themeObject({ kind: 'shelf', name: 'shelf', nameNl: 'stelling', engineType: 'bookshelf', weight: 8, footprints: [rect(1, 1), rect(2, 1)], placement: 'wall', allowedRoomTypes: ['retail', 'storage'] }),
    themeObject({ kind: 'displayCase', name: 'display case', nameNl: 'vitrine', engineType: 'cabinet', weight: 3, footprints: [rect(1, 1), rect(2, 1), rect(3, 1, 0.5)], placement: 'wall', allowedRoomTypes: ['retail'] }),
    themeObject({ kind: 'clothesRack', name: 'clothes rack', nameNl: 'kledingrek', engineType: 'wardrobe', themeIcon: 'clothesRack', weight: 6, footprints: [rect(2, 1), rect(3, 1, 0.5)], placement: 'centre', allowedRoomTypes: ['retail', 'fitting'] }),
    themeObject({ kind: 'mannequin', name: 'mannequin', nameNl: 'paspop', engineType: 'statue', themeIcon: 'mannequin', weight: 4, footprints: [rect(1, 1)], placement: 'anywhere', allowedRoomTypes: ['retail', 'fitting'] }),
    themeObject({ kind: 'displayTable', name: 'display table', nameNl: 'uitstaltafel', engineType: 'table', weight: 4, footprints: [rect(1, 1), rect(2, 1), rect(2, 2, 0.5)], placement: 'centre', allowedRoomTypes: ['retail', 'dining'] }),
    themeObject({ kind: 'houseplant', name: 'houseplant', nameNl: 'kamerplant', engineType: 'plant', weight: 5, footprints: [rect(1, 1)], placement: 'corner', allowedRoomTypes: ['retail', 'circulation', 'living', 'dining'] }),
    themeObject({ kind: 'adScreen', name: 'advertising screen', nameNl: 'reclamescherm', engineType: 'tv', weight: 2, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 2, allowedRoomTypes: ['retail', 'checkout', 'circulation'] }),
    themeObject({ kind: 'crates', name: 'crates', nameNl: 'krat', clueNoun: 'crate', engineType: 'chest', weight: 3, footprints: [rect(1, 1)], placement: 'wall', allowedRoomTypes: ['storage', 'retail'] }),
    themeObject({ kind: 'vendingMachine', name: 'vending machine', nameNl: 'snackautomaat', engineType: 'cabinet', themeIcon: 'vendingMachine', weight: 1, footprints: [rect(1, 1)], placement: 'wall', maxPerRoom: 1, allowedRoomTypes: ['kitchen', 'circulation'] }),
  ],
}
