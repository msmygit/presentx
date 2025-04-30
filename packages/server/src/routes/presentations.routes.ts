import express, { Request, Response, Router } from 'express';
import {
  createPresentation,
  findPresentationById,
  findPresentationByAccessCode,
  addPageToPresentation,
  updatePresentationState,
  setCurrentAudiencePage,
  deletePageFromPresentation,
  updatePageInPresentation,
  updatePageStatus,
  setAllPagesStatus,
} from '../services/presentation.service';
import { addResponse } from '../services/response.service';
import { z } from 'zod';
import { CreatePresentationRequest, AddPageRequest, SubmitResponseRequest } from '@presentx/shared';
import { authenticateToken } from '../middleware/auth';
import { getPresentationsCollection } from '../db/astra-client';
import { Presentation } from '@presentx/shared';
import crypto from 'crypto';

export const presentationRouter: Router = express.Router();

// --- Input Validation Schemas (using Zod) ---
const createPresentationSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

// Base Page Schema
const pageBaseSchema = z.object({
  page_order: z.number().int().min(0),
  page_title: z.string().optional(),
});

// Page Type Specific Config Schemas
const multiChoiceConfigSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
  allow_multiple: z.boolean().optional(),
});

const pollConfigSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
});

const openEndedConfigSchema = z.object({
  question: z.string().min(1),
  max_length: z.number().int().positive().optional(),
});

const scalesConfigSchema = z.object({
  question: z.string().min(1),
  scale_min: z.number().int(),
  scale_max: z.number().int(),
  label_min: z.string().optional(),
  label_max: z.string().optional(),
}).refine(data => data.scale_max > data.scale_min, {
    message: "scale_max must be greater than scale_min",
    path: ["scale_max"], // Path of the error
});

const rankingConfigSchema = z.object({
  question: z.string().min(1),
  items: z.array(z.string().min(1)).min(1), // Must have at least one item to rank
});

const wordCloudConfigSchema = z.object({
  question: z.string().min(1),
  max_length: z.number().int().positive().optional(),
});

const qnaConfigSchema = z.object({
  allow_anonymous_questions: z.boolean().optional(),
  allow_upvotes: z.boolean().optional(),
});

// Discriminated union for AddPageRequest validation
const addPageSchema = z.discriminatedUnion("page_type", [
  pageBaseSchema.extend({ page_type: z.literal("multi-choice"), page_config: multiChoiceConfigSchema }),
  pageBaseSchema.extend({ page_type: z.literal("poll"), page_config: pollConfigSchema }),
  pageBaseSchema.extend({ page_type: z.literal("open-ended"), page_config: openEndedConfigSchema }),
  pageBaseSchema.extend({ page_type: z.literal("scales"), page_config: scalesConfigSchema }),
  pageBaseSchema.extend({ page_type: z.literal("ranking"), page_config: rankingConfigSchema }),
  pageBaseSchema.extend({ page_type: z.literal("word-cloud"), page_config: wordCloudConfigSchema }),
  pageBaseSchema.extend({ page_type: z.literal("q&a"), page_config: qnaConfigSchema }),
]);


const submitResponseSchema = z.object({
    user_id: z.string().optional(), // Optional on input, default handled in service
    response_data: z.any(), // Validate more strictly based on page_type if possible/needed
});

const updateStateSchema = z.object({
    state: z.enum(['draft', 'active', 'completed'])
});

const setCurrentPageSchema = z.object({
    pageId: z.string().uuid().nullable() // Expecting UUID or null
});

// Schema for updating a page - allow partial updates of title or config
const updatePageSchema = z.object({
    page_title: z.string().min(1).optional(),
    // Config validation is tricky on update as type isn't changing.
    // We could re-use the discriminated union logic, but make fields optional?
    // For now, allow any object, rely on service logic if needed.
    page_config: z.object({}).passthrough().optional(),
}).strict(); // Disallow extra fields


// Schema for updating page status
const updatePageStatusSchema = z.object({
    status: z.enum(['active', 'skipped'])
});

// Schema for setting status for all pages
const setAllPagesStatusSchema = z.object({
    status: z.enum(['active', 'skipped'])
});

// --- Middleware for Async Handlers ---
const asyncHandler = (fn: (req: Request, res: Response, next: express.NextFunction) => Promise<any>) => 
    (req: Request, res: Response, next: express.NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Routes ---

// [POST] /api/presentations - Create a new presentation
presentationRouter.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const validated = createPresentationSchema.parse(req.body);
    const createdPresentation = await createPresentation({
      title: validated.title,
      description: validated.description || '',
      presenter_id: req.user!.id,
    });

    res.status(201).json(createdPresentation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('[POST /api/presentations] Error:', error);
      res.status(500).json({ error: 'Failed to create presentation' });
    }
  }
}));

// [GET] /api/presentations/join?access_code=XYZ123 - Audience joins an active presentation
presentationRouter.get(
  '/join',
  asyncHandler(async (req: Request, res: Response) => {
    const accessCode = (req.query.access_code as string)?.toUpperCase(); // Ensure uppercase
    console.log(`[Route /join] Received access_code query param: ${accessCode}`); // Log received code
    if (!accessCode) {
      return res.status(400).json({ message: 'Access code is required' });
    }
    console.log(`[Route /join] Calling findPresentationByAccessCode with: ${accessCode}`); // Log before calling service
    const presentation = await findPresentationByAccessCode(accessCode);
    if (!presentation) {
      console.log(`[Route /join] findPresentationByAccessCode returned null for code: ${accessCode}`); // Log if not found
      return res.status(404).json({ message: 'Active presentation with this code not found' });
    }
    console.log(`[Route /join] Found presentation ID: ${presentation._id} for code: ${accessCode}`); // Log if found
    res.status(200).json({ presentation }); // Return presentation data needed by audience client
  })
);

// [GET] /api/presentations/:presentationId - Get presentation details (for presenter/admin)
presentationRouter.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const requestedId = req.params.id;
  console.log(`[GET /api/presentations/:id] Received request for ID: ${requestedId}`);
  const collection = getPresentationsCollection();
  const presentation = await collection.findOne({
    _id: requestedId,
    presenter_id: req.user.id
  });
  
  if (!presentation) {
    console.log(`[GET /api/presentations/:id] Presentation not found or user mismatch for ID: ${requestedId}`);
    return res.status(404).json({ error: 'Presentation not found or not owned by user' });
  }
  
  console.log(`[GET /api/presentations/:id] Found presentation for ID: ${requestedId}`);
  res.json(presentation);
}));

// [POST] /api/presentations/:presentationId/pages - Add a new page
presentationRouter.post(
  '/:presentationId/pages',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { presentationId } = req.params;
    const validatedData = addPageSchema.parse(req.body);
    const updatedPresentation = await addPageToPresentation(presentationId, validatedData as AddPageRequest);
    res.status(201).json(updatedPresentation);
  })
);

// [POST] /api/presentations/:presentationId/pages/:pageId/responses - Submit audience response
presentationRouter.post(
  '/:presentationId/pages/:pageId/responses',
  asyncHandler(async (req: Request, res: Response) => {
    const { presentationId, pageId } = req.params;
    const validatedData = submitResponseSchema.parse(req.body);
    // In a real app, might get user_id from session/token or allow anonymous
    await addResponse(presentationId, pageId, validatedData as SubmitResponseRequest);
    res.status(204).send(); // No content needed on success
  })
);

// [DELETE] /api/presentations/:presentationId/pages/:pageId - Delete a page
presentationRouter.delete(
    '/:presentationId/pages/:pageId',
    authenticateToken,
    asyncHandler(async (req: Request, res: Response, next: express.NextFunction) => {
        try {
            const { presentationId, pageId } = req.params;
            const userId = req.user!.id;

            const updatedPresentation = await deletePageFromPresentation(presentationId, pageId, userId);

            if (updatedPresentation === null) {
                // Service returns null if page wasn't found in a presentation owned by user in draft state
                return res.status(404).json({ message: 'Page not found or presentation not in draft state for deletion.' });
            }

            res.status(200).json(updatedPresentation); // Return updated presentation
        } catch (error) {
            console.error(`[DELETE /:presentationId/pages/:pageId] Error:`, error);
            if (error instanceof Error) {
                 if (error.message.includes('Presentation not found')) {
                    return res.status(404).json({ message: error.message });
                } else if (error.message.includes('Forbidden')) {
                    return res.status(403).json({ message: error.message });
                } else if (error.message.includes('draft state')) {
                    return res.status(400).json({ message: error.message });
                }
            }
            next(error); // Pass other errors to global handler
        }
    })
);

// [PUT] /api/presentations/:id - Update presentation details (title, description)
presentationRouter.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const validated = createPresentationSchema.parse(req.body);
  const collection = getPresentationsCollection();
  const presentationId = req.params.id;
  const userId = req.user.id;

  const updateResult = await collection.findOneAndUpdate(
      { _id: presentationId, presenter_id: userId },
      { $set: {
          title: validated.title,
          description: validated.description,
          updated_at: new Date().toISOString()
        } 
      },
      { returnDocument: 'after' }
  );

  if (!updateResult || !updateResult.value) {
    return res.status(404).json({ error: 'Presentation not found or not owned by user' });
  }

  res.json(updateResult.value);
}));

// [PUT] /api/presentations/:presentationId/current-page - Set the active page (audience view)
presentationRouter.put(
    '/:presentationId/current-page',
    authenticateToken,
    asyncHandler(async (req: Request, res: Response) => {
        const { presentationId } = req.params;
        const { pageId } = setCurrentPageSchema.parse(req.body);
        const updatedPresentation = await setCurrentAudiencePage(presentationId, pageId);
        res.status(200).json(updatedPresentation);
    })
);

// [GET] /api/presentations - Get all presentations for the authenticated user
presentationRouter.get('/', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = req.user.id;
  console.log(`[GET /api/presentations] Fetching presentations for user: ${userId}`);
  const collection = getPresentationsCollection();
  const presentations = await collection.find({
    presenter_id: userId
  }).toArray();
  
  console.log(`[GET /api/presentations] Found ${presentations.length} presentations for user: ${userId}`);
  res.json(presentations);
}));

// [DELETE] /api/presentations/:id - Delete a presentation
presentationRouter.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const collection = getPresentationsCollection();
  const presentationId = req.params.id;
  const userId = req.user.id;

  const deleteResult = await collection.deleteOne({ 
      _id: presentationId, 
      presenter_id: userId 
  });

  if (deleteResult.deletedCount === 0) {
    return res.status(404).json({ error: 'Presentation not found or not owned by user' });
  }

  res.status(204).send();
}));

// [POST] /api/presentations/:id/start - Start a presentation session
presentationRouter.post('/:id/start', authenticateToken, asyncHandler(async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const { id: presentationId } = req.params;
    const userId = req.user!.id; // Assuming authenticateToken adds user

    // 1. Find the presentation and verify ownership
    const presentation = await findPresentationById(presentationId);

    if (!presentation) {
        return res.status(404).json({ error: 'Presentation not found' });
    }
    
    if (presentation.presenter_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: You are not the presenter' });
    }

    // 2. Check if already started or completed
    if (presentation.state === 'active') {
        console.warn(`Presentation ${presentationId} is already active. Re-starting not fully implemented.`);
        // Optionally return a specific response or sessionId if needed for active state
    } else if (presentation.state === 'completed') {
        return res.status(400).json({ error: 'Presentation is already completed' });
    }

    // 3. Attempt to update state to 'active' (this might throw)
    const updatedPresentation = await updatePresentationState(presentationId, 'active');

    // 4. Generate a sessionId (placeholder)
    const sessionId = `session-${presentationId.substring(0, 8)}-${Date.now()}`;
    
    // 5. Return sessionId
    res.status(200).json({ sessionId });

  } catch (error) {
    console.error(`[POST /:id/start] Error starting presentation ${req.params.id}:`, error);
    // Check for specific known errors from the service
    if (error instanceof Error && error.message.includes('Cannot activate a presentation with no pages')) {
        return res.status(400).json({ message: error.message }); // Send 400 Bad Request
    } else if (error instanceof Error && error.message.includes('Presentation not found')) { 
        // This case might be redundant if already checked, but good practice
        return res.status(404).json({ message: 'Presentation not found' });
    } else {
        // Pass other errors to the global error handler
        next(error); 
    }
  }
}));

// [PUT] /api/presentations/:id/state - Update presentation state (start/end/deactivate)
presentationRouter.put('/:id/state', authenticateToken, asyncHandler(async (req: Request, res: Response, next: express.NextFunction) => {
    try {
        const { id: presentationId } = req.params;
        const validatedData = updateStateSchema.parse(req.body);
        const userId = req.user!.id; // Assume user is attached

        // Optional: Add check to ensure user owns the presentation before updating state
        const currentPresentation = await findPresentationById(presentationId);
        if (!currentPresentation) {
            return res.status(404).json({ message: 'Presentation not found' });
        }
        if (currentPresentation.presenter_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this presentation' });
        }
        
        // TODO: Add logic to prevent invalid state transitions? 
        // e.g., cannot go from 'completed' back to 'active'?
        // For now, allow any valid state transition.

        const updatedPresentation = await updatePresentationState(presentationId, validatedData.state);

        if (!updatedPresentation) {
            // This might happen if updatePresentationState fails internally after the initial check
            return res.status(404).json({ message: 'Presentation not found during update' });
        }

        res.status(200).json(updatedPresentation);
    } catch (error) {
        if (error instanceof z.ZodError) {
           return res.status(400).json({ message: 'Invalid state value', errors: error.errors });
        }
        // Handle specific errors from updatePresentationState if needed
        console.error(`[PUT /:id/state] Error updating state for ${req.params.id}:`, error);
        next(error); // Pass to global error handler
    }
}));

// --- New Route: Set Status for All Pages ---
presentationRouter.put(
    '/:presentationId/pages/status', // Endpoint to update status for all pages
    authenticateToken,
    asyncHandler(async (req: Request, res: Response, next: express.NextFunction) => {
        try {
            const { presentationId } = req.params;
            const userId = req.user!.id;
            // Specific schema for this route
            const setAllStatusSchema = z.object({ 
                status: z.enum(['active', 'skipped'], { 
                    required_error: "Status field is required ('active' or 'skipped')."
                })
             });
            const { status } = setAllStatusSchema.parse(req.body);

            const updatedPresentation = await setAllPagesStatus(presentationId, userId, status);
            res.status(200).json(updatedPresentation);
        } catch (error) {
            console.error(`[PUT /:presentationId/pages/status] Error:`, error);
            if (error instanceof z.ZodError) {
                // Provide specific Zod errors
                return res.status(400).json({ message: 'Invalid request body', errors: error.errors });
            }
            if (error instanceof Error) {
                 if (error.message.includes('not found')) { 
                    return res.status(404).json({ message: error.message });
                } else if (error.message.includes('Forbidden')) {
                    return res.status(403).json({ message: error.message });
                } 
            }
            // Pass any other errors to the default handler
            next(error);
        }
    })
);

// --- Route: Update Page (Content: Title/Config) ---
presentationRouter.put(
    '/:presentationId/pages/:pageId',
    authenticateToken,
    asyncHandler(async (req: Request, res: Response, next: express.NextFunction) => {
        try {
            const { presentationId, pageId } = req.params;
            const userId = req.user!.id;
            console.log(`[PUT /pages/:pageId] Route handler started for pId: ${presentationId}, pageId: ${pageId}`);
            const validatedData = updatePageSchema.parse(req.body);
            console.log(`[PUT /pages/:pageId] Validated body:`, validatedData);

            // Only include fields that were actually provided in the request body
            const updatePayload: import('../services/presentation.service').UpdatePageData = {};
            if (validatedData.page_title !== undefined) {
                updatePayload.page_title = validatedData.page_title;
            }
            if (validatedData.page_config !== undefined) {
                updatePayload.page_config = validatedData.page_config;
            }
            console.log(`[PUT /pages/:pageId] Constructed updatePayload:`, updatePayload);

            if (Object.keys(updatePayload).length === 0) {
                console.log(`[PUT /pages/:pageId] Update payload is empty, returning 400.`);
                return res.status(400).json({ message: 'No update data provided (title or config required).' });
            }

            console.log(`[PUT /pages/:pageId] Calling updatePageInPresentation service...`);
            const updatedPresentation = await updatePageInPresentation(
                presentationId, 
                pageId, 
                userId, 
                updatePayload
            );
            console.log(`[PUT /pages/:pageId] Service call completed.`);

            // updatePageInPresentation throws errors handled below
            res.status(200).json(updatedPresentation); // Return updated presentation

        } catch (error) {
            console.error(`[PUT /:presentationId/pages/:pageId] Error:`, error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Invalid update data', errors: error.errors });
            }
            if (error instanceof Error) {
                 if (error.message.includes('not found')) { // Covers presentation or page not found
                    return res.status(404).json({ message: error.message });
                } else if (error.message.includes('Forbidden')) {
                    return res.status(403).json({ message: error.message });
                } else if (error.message.includes('draft state')) {
                    return res.status(400).json({ message: error.message });
                }
            }
            next(error); // Pass other errors to global handler
        }
    })
);

// --- New Route: Update Single Page Status ---
presentationRouter.put(
    '/:presentationId/pages/:pageId/status',
    authenticateToken,
    asyncHandler(async (req: Request, res: Response, next: express.NextFunction) => {
        try {
            const { presentationId, pageId } = req.params;
            const userId = req.user!.id;
            // Validate the incoming status
            const statusSchema = z.object({ status: z.enum(['active', 'skipped']) });
            const { status } = statusSchema.parse(req.body);

            const updatedPresentation = await updatePageStatus(presentationId, pageId, userId, status);
            res.status(200).json(updatedPresentation);
        } catch (error) {
            console.error(`[PUT /pages/:pageId/status] Error:`, error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Invalid status value', errors: error.errors });
            }
             if (error instanceof Error) {
                 if (error.message.includes('not found')) { 
                    return res.status(404).json({ message: error.message });
                } else if (error.message.includes('Forbidden')) {
                    return res.status(403).json({ message: error.message });
                } 
            }
            next(error);
        }
    })
);

// --- Error Handler Middleware (Add this to index.ts after routes) ---
// Example basic error handler - customize as needed
export const errorHandler = (err: any, req: Request, res: Response, next: Function) => {
    console.error("API Error:", err);

    if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
    }

    // Check for specific errors if needed (e.g., custom error classes)

    res.status(err.status || 500).json({
        message: err.message || "An unexpected error occurred",
    });
}; 