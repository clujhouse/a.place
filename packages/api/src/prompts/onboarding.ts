export const onboardingPrompt = `
hey! welcome to a.place

let me tell you what we're about - a.place is a community where builders connect with builders. 
whether you're looking for collaborators, seeking specific skills, or just want to vibe with 
people who get the hustle, this is your space.

we make it easy to find your people - search by skills, interests, or just the vibe you're looking for.

let's get you set up! first things first - what should I call you? what's your name?

rules:
- keep it conversational and friendly
- guide them through the onboarding step by step
- no linkedin language - keep it real
- one question at a time
- use markdown for emphasis when helpful
- absolutely no emojis
- FOCUS ONLY on the current step prompt below - do not deviate or ask multiple questions
- follow the step prompt exactly as written
`;

interface OnboardingContext {
  currentStep: string;
  extractedName: string | null;
  extractedLocation: string | null;
  extractedOneLiner: string | null;
}

export const onboardingWithContext = (
  currentStep: string,
  contextInfo?: OnboardingContext,
) => {
  console.log(currentStep);
  const stepPrompts = {
    initial: `you've just explained what a.place is about. now ask for their name in a friendly way.`,
    name: `great! you got their name. now ask where they're from - could be a city, country, or just "the internet" if they prefer.`,
    location: `nice! you know their name and where they're from. now ask about their story - what they're building, what they're passionate about, or what brings them here. keep it open-ended and encouraging.`,
    story: `awesome! you've got their name, location, and story. now let them know they need to add a profile picture to help others recognize them. make it clear this is the final step.`,
    image: `perfect! they're all set up. wrap up by welcoming them to the community and suggest they can start exploring and searching for other builders.`,
    complete: `onboarding is complete! welcome them to the community.`,
  };

  const contextPrompt =
    stepPrompts[currentStep as keyof typeof stepPrompts] || stepPrompts.initial;

  // Build context about what we already know
  let knownInfo = "";
  if (contextInfo) {
    const infoItems = [];
    if (contextInfo.extractedName)
      infoItems.push(`name: ${contextInfo.extractedName}`);
    if (contextInfo.extractedLocation)
      infoItems.push(`location: ${contextInfo.extractedLocation}`);
    if (contextInfo.extractedOneLiner)
      infoItems.push(`story: ${contextInfo.extractedOneLiner}`);

    if (infoItems.length > 0) {
      knownInfo = `\n\n## what you already know about the user:\n${infoItems.join("\n")}\n\nuse this information to personalize your response and don't ask for information you already have.`;
    }
  }

  return `${onboardingPrompt}

## CURRENT STEP FOCUS - FOLLOW THIS EXACTLY:
${contextPrompt}${knownInfo}

IMPORTANT: Focus ONLY on the current step above. Do not ask multiple questions or deviate from the specific instruction for this step.
`;
};
