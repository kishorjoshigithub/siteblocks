// Revisions

import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";

export const makeRevision = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const { projectId } = req.params;
    const { message } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userId || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    //check for credits
    if (user.credits < 5) {
      return res.status(403).json({ message: "Add credits to make revisions" });
    }

    if (!message || message.trim() === "") {
      return res
        .status(400)
        .json({ message: "Please provide a message for the revision" });
    }

    const currentProject = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: {
        versions: true,
      },
    });

    if (!currentProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.conversation.create({
      data: {
        role: "user",
        content: message,
        projectId: projectId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    // Enhance Prompt
    const promptEnhanceResponse = await openai.chat.completions.create({
      model: "kwaipilot/kat-coder-pro:free",
      messages: [
        {
          role: "system",
          content: `You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

    Enhance this by:
    1. Being specific about what elements to change
    2. Mentioning design details (colors, spacing, sizes)
    3. Clarifying the desired outcome
    4. Using clear technical terms

Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`,
        },
        {
          role: "user",
          content: `User Request: "${message}"`,
        },
      ],
    });

    const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I've enhanced your prompt to : ${enhancedPrompt}`,
        projectId: projectId,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `Now making changes to your website...`,
        projectId: projectId,
      },
    });

    const codegenerationResponse = await openai.chat.completions.create({
      model: "kwaipilot/kat-coder-pro:free",
      messages: [
        {
          role: "system",
          content: `You are an expert web developer. 

    CRITICAL REQUIREMENTS:
    - Return ONLY the complete updated HTML code with the requested changes.
    - Use Tailwind CSS for ALL styling (NO custom CSS).
    - Use Tailwind utility classes for all styling changes.
    - Include all JavaScript in <script> tags before closing </body>
    - Make sure it's a complete, standalone HTML document with Tailwind CSS
    - Return the HTML Code Only, nothing else

    Apply the requested changes while maintaining the Tailwind CSS styling approach.`,
        },
        {
          role: "user",
          content: `Here is the current website code : "${currentProject.current_code}" The user wants this change : "${enhancedPrompt}"`,
        },
      ],
    });

    const code = codegenerationResponse.choices[0].message.content || "";
    if (!code) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: `Unable to generate code. Please try again.`,
          projectId: projectId,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: 5 },
        },
      });
      return res
        .status(400)
        .json({ message: "Unable to generate code. Please try again." });
    }

    const version = await prisma.version.create({
      data: {
        code: code
          .replace(/```[a-z]*\n?/gi, "")
          .replace(/```$/g, "")
          .trim(),
        description: "changes made",
        projectId: projectId,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I've made the changes to your website! You can now preview it`,
        projectId: projectId,
      },
    });

    await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        current_code: code
          .replace(/```[a-z]*\n?/gi, "")
          .replace(/```$/g, "")
          .trim(),
        current_version_index: version.id,
      },
    });

    res.json({ message: "Revision made successfully" });
  } catch (error: any) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { increment: 5 },
      },
    });
    console.log(error.code);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Roll back to a previous version

export const rollBackToVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId, versionId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: {
        versions: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const version = await prisma.version.findUnique({
      where: { id: versionId },
      include: {
        project: true,
      },
    });

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    if (version.projectId !== project.id) {
      return res.status(403).json({ message: "Invalid version" });
    }

    await prisma.websiteProject.update({
      where: { id: projectId, userId },
      data: {
        current_code: version.code,
        current_version_index: version.id,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I've rolled back your website to version ${version.id}. You can now preview it.`,
        projectId,
      },
    });

    res.json({ message: "Version rolled back successfully" });
  } catch (error: any) {
    console.log(error.code);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Delete a project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.websiteProject.delete({
      where: { id: projectId },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.log(error.code);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Get code for preview

export const getProjectPreview = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findFirst({
      where: { id: projectId, userId },
      include: {
        versions: true,
      },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ project });
  } catch (error: any) {
    console.log(error.code);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Get published projects
export const getPublishedProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.websiteProject.findMany({
      where: { isPublished: true },
      include: {
        user: true,
      },
    });
    res.json({ projects });
  } catch (error: any) {
    console.log(error.code);
    res.status(400).json({ message: error.code || error.message });
  }
};

// get project by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.websiteProject.findFirst({
      where: { id: projectId },
    });

    if (!project || project.isPublished === false) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ code: project.current_code });
  } catch (error: any) {
    console.log(error.code);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Save project
export const saveProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { projectId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: {
        versions: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Please provide a code" });
    }

    await prisma.websiteProject.update({
      where: { id: projectId, userId },
      data: {
        current_code: code,
        current_version_index: "",
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I've created your website! You can now preview it and request any changes`,
        projectId,
      },
    });

    res.json({ message: "Project saved successfully" });
  } catch (error: any) {
    console.log(error.code);
    res.status(400).json({ message: error.code || error.message });
  }
};
