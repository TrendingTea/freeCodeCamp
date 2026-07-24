// --- THE FREE CODE CAMP LEGO INSTRUCTIONS IN TYPESCRIPT --

// Import the Node.js file system module for file operations (like throwing away physical paper we do not need anymore)
import fs from 'fs';

// Import helper functions for getting pathing and metadata details (tools to find where our Lego set lives and opening its main instruction manaul)
import { getProjectPath } from './helpers/get-project-info.js';
import { getMetaData } from './helpers/project-metadata.js';

// Import utility functions for file creation, metadata extraction, and title updates (tools for writing new pages, erasing old pages, and re-numbering pages)
import {
  createStepFile,
  deleteStepFromMeta,
  getChallenge,
  insertStepIntoMeta,
  updateStepTitles
} from './utils.js';

// Import ObjectId from 'bson' to generate unique IDs for each new step/challenge (tools to create unique "Nametag Stamps" for each page)
import { ObjectId } from 'bson';

/**
 * Deletes specified step/challenge from project files and metadata
 * (STORY: Removing a page from our Lego instruction booklet)
 */
async function deleteStep(stepNum: number): Promise<void> {

  // Input validation: Step must start at index 1 or higher (cannot delete a page 0 or a negative number)
  if (stepNum < 1) {
    throw Error('Step not deleted. Step num must be a number greater than 0.');
  }

  // Fetch current ordered challenge/step list (open the Lego manual to see how many total pages we have)
  const challengeOrder = getMetaData().challengeOrder;

  // Boundary check: Ensure the target step number isn't higher than the total steps available (cannot delete page 9 if there are only 4 pages)
  if (stepNum > challengeOrder.length)
    throw Error(
      `Step # ${stepNum} not deleted. Largest step number is ${challengeOrder.length}.`
    );

  // Retrieve unique ID of the step to be deleted (find the hidden "Nametag" for exact page)
  const stepId = challengeOrder[stepNum - 1].id;

  // Delete physical markdown (throw physical paper page in the trash)
  fs.unlinkSync(`${getProjectPath()}${stepId}.md`);

  // Remove step entry from the project metadata tracking file (delete this page's name from main table of contents)
  await deleteStepFromMeta({ stepNum });

  // Index/update step titles so remaining steps reflect new positions (update the numbers on all remaining pages so there are no gaps)
  updateStepTitles();

  console.log(`Successfully deleted step #${stepNum}`);
}

/**
 * Inserts a new step at specified position in object sequence
 * (STORY: Squeezing a brand-new page into the middle of our Lego manual/booklet)
 */
async function insertStep(stepNum: number): Promise<void> {

  // Input validation: Insertion must be 1 or higher (we need to start with a positive and nonzero value...gotta have something!)
  if (stepNum < 1) {
    throw Error('Step not inserted. New step number must be greater than 0.');
  }
  
  const challengeOrder = getMetaData().challengeOrder;

  // Boundary check: May not insert beyond "last step +1" position (cannot insert page 20 to a 5 page manual)
  if (stepNum > challengeOrder.length + 1)
    throw Error(
      `Step not inserted. New step number must be less than ${
        challengeOrder.length + 2
      }.`
    );

  // Fetch surrounding challenges to copy base code (examine previous and following pages to see what Legos are being used)
  const previousChallenge =
    stepNum > 1 ? getChallenge(challengeOrder[stepNum - 2].id) : null;
  const nextChallenge =
    stepNum <= challengeOrder.length
      ? getChallenge(challengeOrder[stepNum - 1].id)
      : null;

  // Inherit available starter files, seeds, from previous step (copy the Lego bricks used on the previous page)
  const challengeSeeds = previousChallenge?.challengeFiles ?? [];

  // Inherit challenge type from the previous step or next step/challenge (copy the theme/style (e.g., Star Wars or the Wizarding World of Harry Potter) from our neighboring pages)
  const challengeType =
    previousChallenge?.challengeType ?? nextChallenge?.challengeType;

  // Generate a new BSON unique ID for new step/challenge (stamp a new "Nametag" for our new inserted page)
  const challengeId = new ObjectId();

  // Create a physical file with default properties (print our new physical page insertion with our added instructions and Lego bricks) 
  createStepFile({
    challengeId,
    stepNum,
    challengeType,
    challengeSeeds
  });

  // Register step/challenge inside metadata registry (slide new page into the table of contents at insertion spot)
  await insertStepIntoMeta({ stepNum, stepId: challengeId });

  // Adjust step/challenge titles sequenially following insertion (renumber every page accordingly for sequential page count (1, 2, 3, ...,))
  updateStepTitles();
  console.log(`Successfully inserted new step #${stepNum}`);
}

/**
 * Generates multiple blank/empty steps appended to the end of the relevant challenge sequence
 * (STORY: Adding a whole stack of blank draft pages at the end of the manual/booklet)
 */
async function createEmptySteps(num: number): Promise<void> {

  // Input validation: restrict size (must request at least 1 page and no more than 999 pages)
  if (num < 1 || num > 1000) {
    throw Error(
      `No steps created. arg 'num' must be between 1 and 1000 inclusive`
    );
  }

  // Determine next starting step/challenge (identify the last page number in the book)
  const nextStepNum = getMetaData().challengeOrder.length + 1;

  // Loop through and incrementially create each requested empty step (print empty pages one by one until requested stack is completed)
  for (let stepNum = nextStepNum; stepNum < nextStepNum + num; stepNum++) {

    // Label the ID on the new production (stamp a unique ID "Nametag" for every new page)
    const challengeId = new ObjectId();

    // Create default step/challenge file and register in metadata (print blank page and include entry in table of contents)
    createStepFile({ stepNum, challengeId });
    await insertStepIntoMeta({ stepNum, stepId: challengeId });
  }
  console.log(`Successfully added ${num} steps`);
}

// Export challenges/steps results to interact with more parts of the application (share Lego booklet manual with all of our peers)
export { deleteStep, insertStep, createEmptySteps };
