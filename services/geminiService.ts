import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Template } from "../types";

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string; } }>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader result is not a string.'));
      }
      const parts = reader.result.split(',');
      if (parts.length < 2 || !parts[1]) {
        return reject(new Error('Invalid data URL format. Failed to extract base64 data.'));
      }
      resolve({
        inlineData: {
          data: parts[1],
          mimeType: file.type || 'application/octet-stream',
        },
      });
    };

    reader.onerror = () => reject(new Error(`Failed to read file: ${reader.error?.message}`));
    reader.onabort = () => reject(new Error('File reading was aborted.'));

    reader.readAsDataURL(file);
  });
};

export const editImageWithTemplate = async (imageFile: File, prompt: string, styleImageFile: File | null): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const generateSingleImage = async (): Promise<string> => {
    
    const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string; })[] = [];
    
    if (styleImageFile) {
        // The user wants the style image to be the template and the original selfie to be the content reference.
        // So, the style image is the *first* image and the selfie is the *second*.
        const styleImagePart = await fileToGenerativePart(styleImageFile);
        const userImagePart = await fileToGenerativePart(imageFile);
        parts.push(styleImagePart);
        parts.push(userImagePart);
    } else {
        // Original logic: the user's selfie is the only image, to be edited with a text prompt.
        const imagePart = await fileToGenerativePart(imageFile);
        parts.push(imagePart);
    }

    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: parts,
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates?.[0]?.finishReason === 'SAFETY' || !response.candidates?.[0]?.content) {
      const blockReason = response.promptFeedback?.blockReason;
      console.error('Image generation blocked.', { blockReason, promptFeedback: response.promptFeedback });
      throw new Error(`Image generation was blocked due to safety reasons: ${blockReason || 'Unknown'}`);
    }

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    console.error("Model response did not contain an image part.", { response });
    throw new Error("The model did not return an image. Please try a different prompt or image.");
  };

  const imagePromises = [
    generateSingleImage(),
    generateSingleImage(),
    generateSingleImage(),
  ];

  try {
    const settlements = await Promise.allSettled(imagePromises);
    
    const successfulResults = settlements
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulResults.length === 0) {
      const failedReasons = settlements
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason?.message || 'Unknown error');
      
      console.error("All image generation attempts failed:", failedReasons);
      const primaryReason = failedReasons.length > 0 ? failedReasons[0] : 'The model failed to generate any images.';
      throw new Error(primaryReason);
    }
    
    return successfulResults;

  } catch (error) {
    console.error("Failed to generate image variants:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate image variants. The model might have refused the request.");
  }
};


export const generateTemplateIdea = async (): Promise<Template> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const generationPrompt = `
    You are an expert in creative photo editing styles. Generate a single, novel photo editing template idea for a user's selfie. The idea should be unique and visually interesting. Your response must be a JSON object that conforms to the specified schema.
    - "id": A unique, lowercase, snake_case identifier for the template (e.g., "cosmic_dust").
    - "name": A short, catchy name for the template (e.g., "Cosmic Dust").
    - "prompt": A detailed, descriptive prompt for an AI image model to transform a selfie into this style. The prompt should be written in the second person, addressing the model (e.g., "Transform the person in the photo...").
    - "thumbnail": A placeholder image URL from picsum.photos, using the generated ID as the seed. The format must be exactly: "https://picsum.photos/seed/{id}/200".
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: generationPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique, lowercase, snake_case identifier." },
          name: { type: Type.STRING, description: "A short, catchy name for the template." },
          prompt: { type: Type.STRING, description: "A detailed prompt for the image model." },
          thumbnail: { type: Type.STRING, description: "A placeholder image URL from picsum.photos." },
        },
        required: ["id", "name", "prompt", "thumbnail"],
      }
    }
  });

  const parsedResponse = JSON.parse(response.text);
  return parsedResponse as Template;
}

export const generatePromptFromStyleImage = async (imageFile: File): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(imageFile);

  const generationPrompt = `You are an expert art director and a master prompt engineer for generative AI. Your task is to analyze the provided image and generate a highly detailed, descriptive text prompt that an AI image model can use to replicate its unique visual style.

Your analysis must be comprehensive. Deconstruct the image and describe the following elements with precision:
- **Art Medium & Style:** Is it a photograph, oil painting, 3D render, watercolor, etc.? Describe the overall style (e.g., hyper-realistic, impressionistic, surreal, anime, steampunk).
- **Subject & Composition:** What is the subject? How is it framed? Mention compositional rules like the rule of thirds, leading lines, or symmetry if applicable.
- **Camera & Lens:** Describe the photographic properties as if it were a real photo. What is the camera angle (e.g., eye-level, low-angle shot, high-angle shot, bird's-eye view)? What is the depth of field (e.g., shallow depth of field with a blurry bokeh background, deep focus where everything is sharp)?
- **Lighting:** Characterize the lighting. Is it soft and diffused, harsh and dramatic, cinematic, natural light, golden hour, neon glow? Mention the direction and color of the light.
- **Color Palette:** Describe the dominant colors, the overall color scheme (e.g., monochromatic, analogous, complementary), and the mood they create (e.g., muted and desaturated, vibrant and saturated, warm, cool).
- **Artistic Techniques:** Identify any specific techniques used, such as long exposure, lens flare, film grain, double exposure, visible brushstrokes, cross-hatching, or specific digital effects.
- **Mood & Atmosphere:** Summarize the overall feeling of the image (e.g., ethereal and dreamlike, gritty and dystopian, serene and peaceful, energetic and chaotic).

Combine these observations into a single, coherent paragraph. The prompt should be a direct instruction to the image model, rich with evocative adjectives and technical details.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
        parts: [
            { text: generationPrompt },
            imagePart
        ],
    }
  });

  return response.text;
};

export const generateThumbnailForPrompt = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const thumbnailPrompt = `A visually striking, simple, iconic, square thumbnail image representing the artistic style of: "${prompt}"`;

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: thumbnailPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
    throw new Error("Thumbnail generation failed, no image was returned.");
  }
  
  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};