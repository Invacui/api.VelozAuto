/**
 * @file content.seed.ts
 * @description Seeds CMS content: banners, testimonials, FAQ tree, site
 *              settings (singleton) and per-page SEO settings.
 * @module Seeds
 * @author VehicleMarket Backend
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import Banner from '../models/Banner.model';
import Testimonial from '../models/Testimonial.model';
import FaqCategory from '../models/FaqCategory.model';
import FaqArticle from '../models/FaqArticle.model';
import SiteSetting from '../models/SiteSetting.model';
import SeoSetting from '../models/SeoSetting.model';
import logger from '../logger/index';

const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pic = (seed: string) => `https://picsum.photos/seed/${seed}/1600/700`;

const BANNERS = [
  { title: 'Buy your next car with confidence', subtitle: '200-point inspected used cars with warranty', image: pic('vm-hero-1'), link: '/vehicles?category=PASSENGER_CAR', position: 'HERO', sortOrder: 1 },
  { title: 'Sell your vehicle in 24 hours', subtitle: 'Free doorstep inspection, instant payment', image: pic('vm-hero-2'), link: '/sell', position: 'HERO', sortOrder: 2 },
  { title: 'Commercial vehicles for every business', subtitle: 'Trucks, tippers, buses & more — verified', image: pic('vm-hero-3'), link: '/vehicles?category=COMMERCIAL', position: 'HERO', sortOrder: 3 },
  { title: 'Get top rupee for your old vehicle', subtitle: 'No paperwork hassles, RC transfer handled', image: pic('vm-sell-strip'), link: '/sell', position: 'SELL_STRIP', sortOrder: 1 },
  { title: 'Cars', subtitle: 'Hatchbacks, sedans & SUVs', image: pic('vm-cat-car'), link: '/vehicles?category=PASSENGER_CAR', position: 'CATEGORIES', sortOrder: 1 },
  { title: 'Commercial', subtitle: 'LCV, HCV, buses & tippers', image: pic('vm-cat-commercial'), link: '/vehicles?category=COMMERCIAL', position: 'CATEGORIES', sortOrder: 2 },
  { title: 'Two Wheelers', subtitle: 'Bikes & scooters', image: pic('vm-cat-2w'), link: '/vehicles?category=TWO_WHEELER', position: 'CATEGORIES', sortOrder: 3 },
  { title: 'Three Wheelers', subtitle: 'Autos & e-rickshaws', image: pic('vm-cat-3w'), link: '/vehicles?category=THREE_WHEELER', position: 'CATEGORIES', sortOrder: 4 },
  { title: 'Caravans & Motorhomes', subtitle: 'Explore in comfort', image: pic('vm-cat-caravan'), link: '/vehicles?category=CARAVAN_MOTORHOME', position: 'CATEGORIES', sortOrder: 5 },
];

const TESTIMONIALS = [
  { name: 'Rahul Sharma', city: 'Delhi', role: 'Bought a Hyundai Creta', quote: 'The whole process was transparent. The inspection report matched the car exactly, and RC transfer was handled end-to-end.', rating: 5, avatar: pic('vm-t1'), sortOrder: 1 },
  { name: 'Priya Nair', city: 'Bengaluru', role: 'Sold a Maruti Swift', quote: 'I got a fair offer within a day of the inspection and the money hit my account the same evening. Highly recommended.', rating: 5, avatar: pic('vm-t2'), sortOrder: 2 },
  { name: 'Imran Qureshi', city: 'Jaipur', role: 'Bought a Tata Ace', quote: 'Bought a used mini truck for my distribution business. The team understood commercial vehicles well.', rating: 4, avatar: pic('vm-t3'), sortOrder: 3 },
  { name: 'Meera Iyer', city: 'Chennai', role: 'Bought a Royal Enfield', quote: 'Smooth, no-pressure buying experience. The bike was serviced and delivered spotless.', rating: 5, avatar: pic('vm-t4'), sortOrder: 4 },
];

const FAQ_TREE: { title: string; description: string; sortOrder: number; articles: { question: string; answer: string }[] }[] = [
  {
    title: 'Buying a Vehicle',
    description: 'Everything about purchasing from VehicleMarket',
    sortOrder: 1,
    articles: [
      { question: 'Are all vehicles inspected?', answer: 'Every listed vehicle passes a multi-point inspection covering engine, body, electricals, tyres and documents before it goes live. Inspected vehicles carry a badge and score.' },
      { question: 'Can I get a test drive?', answer: 'Yes. Raise a Buy Request and choose the "test drive" option — our team will schedule a slot at a hub near you.' },
      { question: 'Do you help with finance?', answer: 'We partner with leading lenders. Mark your Buy Request as needing finance and an advisor will share EMI options.' },
      { question: 'Is the price negotiable?', answer: 'Vehicles marked negotiable can be discussed; fixed-price listings have our best price already.' },
    ],
  },
  {
    title: 'Selling Your Vehicle',
    description: 'How to sell your vehicle to us',
    sortOrder: 2,
    articles: [
      { question: 'How do I get an offer?', answer: 'Submit a Sell Request with your vehicle details and photos. We review it, schedule a free inspection and then make an offer.' },
      { question: 'Is the inspection free?', answer: 'Yes, the inspection is completely free with no obligation to sell.' },
      { question: 'How soon is payment made?', answer: 'Once you accept the offer, payment is initiated the same day after document verification.' },
    ],
  },
  {
    title: 'Documentation & Transfer',
    description: 'RC, insurance and ownership transfer',
    sortOrder: 3,
    articles: [
      { question: 'Who handles the RC transfer?', answer: 'We handle the ownership transfer paperwork for you, including NOC and RTO formalities, for both buy and sell.' },
      { question: 'What if my vehicle has an active loan?', answer: 'We can settle the loan with the financier and complete the NOC process as part of the sale.' },
    ],
  },
  {
    title: 'Payments & Refunds',
    description: 'Payment modes and policies',
    sortOrder: 4,
    articles: [
      { question: 'What payment modes are accepted?', answer: 'We accept bank transfer / UPI / RTGS. For buyers, loan-financed purchases are supported through partners.' },
      { question: 'Is a booking amount refundable?', answer: 'Booking amounts are refundable within the cooling-off window as per your agreement terms.' },
    ],
  },
];

const SEO_PAGES = [
  { path: '/', title: 'VehicleMarket — Buy & Sell Used Vehicles in India', description: 'Buy inspected used cars, bikes, commercial vehicles and caravans. Sell your vehicle in 24 hours with free doorstep inspection.', keywords: ['used cars india', 'buy used car', 'sell car', 'used commercial vehicles', 'second hand bikes'] },
  { path: '/vehicles', title: 'Used Vehicles for Sale in India | VehicleMarket', description: 'Browse thousands of inspected used cars, two-wheelers, commercial vehicles and caravans across India with transparent pricing.', keywords: ['used vehicles for sale', 'second hand cars', 'used trucks', 'used bikes'] },
  { path: '/sell', title: 'Sell Your Vehicle Online in India | VehicleMarket', description: 'Get an instant offer for your used car, bike or commercial vehicle. Free inspection and same-day payment.', keywords: ['sell my car', 'sell used car india', 'vehicle valuation'] },
  { path: '/about', title: 'About VehicleMarket', description: 'India\'s trusted marketplace for pre-owned vehicles — inspected, priced fairly and paperwork handled.' },
  { path: '/contact', title: 'Contact VehicleMarket', description: 'Reach our team for buying, selling, finance and support queries.' },
  { path: '/faq', title: 'Frequently Asked Questions | VehicleMarket', description: 'Answers to common questions about buying, selling, documentation and payments.' },
];

export const runContentSeed = async (): Promise<void> => {
  // Banners
  let bannersCreated = 0;
  for (const b of BANNERS) {
    const exists = await Banner.findOne({ title: b.title, position: b.position });
    if (exists) continue;
    await Banner.create(b);
    bannersCreated += 1;
  }

  // Testimonials
  let tCreated = 0;
  for (const t of TESTIMONIALS) {
    const exists = await Testimonial.findOne({ name: t.name });
    if (exists) continue;
    await Testimonial.create(t);
    tCreated += 1;
  }

  // FAQ categories + articles
  let faqCats = 0;
  let faqArts = 0;
  for (const cat of FAQ_TREE) {
    let category = await FaqCategory.findOne({ slug: slugify(cat.title) });
    if (!category) {
      category = await FaqCategory.create({ title: cat.title, description: cat.description, sortOrder: cat.sortOrder });
      faqCats += 1;
    }
    let order = 1;
    for (const a of cat.articles) {
      const exists = await FaqArticle.findOne({ category: category._id, question: a.question });
      if (!exists) {
        await FaqArticle.create({ category: category._id, question: a.question, answer: a.answer, sortOrder: order });
        faqArts += 1;
      }
      order += 1;
    }
  }

  // Site settings (singleton)
  const existingSettings = await SiteSetting.findOne();
  if (!existingSettings) {
    await SiteSetting.create({
      siteName: 'VehicleMarket',
      tagline: 'Buy & sell used vehicles across India — inspected, fair & fast.',
      phone: '+91 90000 00000',
      email: 'care@vehiclemarket.in',
      whatsapp: '919000000000',
      address: 'VehicleMarket HQ, MG Road, Bengaluru, Karnataka 560001, India',
      workingHours: 'Mon–Sat, 9:00 AM – 7:00 PM IST',
      facebook: 'https://facebook.com/vehiclemarket',
      instagram: 'https://instagram.com/vehiclemarket',
      twitter: 'https://twitter.com/vehiclemarket',
      youtube: 'https://youtube.com/@vehiclemarket',
      linkedin: 'https://linkedin.com/company/vehiclemarket',
      defaultMeta: {
        title: 'VehicleMarket — Buy & Sell Used Vehicles in India',
        description: 'Buy inspected used cars, bikes, commercial vehicles and caravans. Sell your vehicle in 24 hours with free doorstep inspection.',
        image: pic('vm-og-default'),
      },
      footerText: 'VehicleMarket is a pre-owned vehicle marketplace connecting buyers and sellers across India with inspections, fair pricing and end-to-end documentation support.',
    });
  }

  // SEO settings
  let seoCreated = 0;
  for (const s of SEO_PAGES) {
    const exists = await SeoSetting.findOne({ path: s.path });
    if (exists) continue;
    await SeoSetting.create({ ...s, keywords: s.keywords || [] });
    seoCreated += 1;
  }

  logger.info(`Content seed: ${bannersCreated} banners, ${tCreated} testimonials, ${faqCats} FAQ categories, ${faqArts} FAQ articles, ${seoCreated} SEO pages`);
};

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await runContentSeed();
      logger.info('Content seed completed');
    } catch (err: any) {
      logger.error('Content seed failed', { fileName: 'content.seed.ts', error: err.message });
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}

export default runContentSeed;
