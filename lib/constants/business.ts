export const DEFAULT_SERVICES = [
  {
    name: "Press-On Application",
    durationMinutes: 60,
    priceNaira: 2500,
    materialsConsumed: "Press-on set, glue, prep kit",
  },
  {
    name: "Nail Painting",
    durationMinutes: 45,
    priceNaira: 1500,
    materialsConsumed: "Polish, top coat",
  },
  {
    name: "Nail Cleaning & Maintenance",
    durationMinutes: 30,
    priceNaira: 1000,
    materialsConsumed: "Sanitizer, cuticle oil",
  },
] as const;

export const BUSINESS_PROFILE = {
  name: "Tams Beauty Hub",
  tagline: "Tams Thrift · Glitz Nails",
  location: "Akure, Ondo State",
  phone: "+2348000000000",
  email: "hello@tamsbeautyhub.com",
} as const;
