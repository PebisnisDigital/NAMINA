import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const weddingSectionSchema = z.enum(["beranda","mempelai","acara","cerita","galeri","rsvp","hadiah"]);
export const weddingFontSchema = z.enum(["romantic","classic","modern"]);
export const weddingMotionSchema = z.enum(["paper","soft","none"]);
export const weddingElementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["text","image","button","video","ornament"]),
  section: weddingSectionSchema,
  x: z.number().min(0).max(95),
  y: z.number().min(0).max(1800),
  width: z.number().min(10).max(100),
  text: z.string().max(800),
  url: z.string().max(2000),
  color,
  fontSize: z.number().min(10).max(90),
  font: weddingFontSchema,
  animation: weddingMotionSchema,
  align: z.enum(["left","center","right"]),
}).strict();
export const weddingDesignSchema = z.object({
  background: color,
  surface: color,
  primary: color,
  accent: color,
  font: weddingFontSchema,
  motion: weddingMotionSchema,
  headingScale: z.number().min(.7).max(1.7),
  sectionColors: z.partialRecord(weddingSectionSchema,color).optional(),
  elements: z.array(weddingElementSchema).max(60),
}).strict();
export type WeddingDesign = z.infer<typeof weddingDesignSchema>;
export type WeddingElement = z.infer<typeof weddingElementSchema>;
export type WeddingSection = z.infer<typeof weddingSectionSchema>;
export const weddingSections: { id: WeddingSection; label: string }[] = [
  {id:"beranda",label:"Beranda & cover"},{id:"mempelai",label:"Mempelai"},
  {id:"acara",label:"Acara & lokasi"},{id:"cerita",label:"Love story"},
  {id:"galeri",label:"Galeri"},{id:"rsvp",label:"RSVP"},
  {id:"hadiah",label:"Hadiah"},
];
export function defaultWeddingDesign(): WeddingDesign {
  return {
    background:"#e9ecdf",surface:"#faf8ee",primary:"#334d3c",accent:"#b49a65",
    font:"romantic",motion:"paper",headingScale:1,sectionColors:{},elements:[],
  };
}
