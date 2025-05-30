export const requiredTopics = [
  "where they're from",
  "what they do for work",
  "their hobbies or interests",
  "the age of the person",
] as const;

export const judgePrompt = `you're checking if someone shared new info about themselves in this convo. keep it chill and look for the basics.

topics we care about:
${requiredTopics.map((topic) => `- ${topic}`).join("\n")}

for each topic, check:
1. did they mention it? (even briefly counts)
2. how much detail? (any is fine)
3. does it seem real? (be chill - only flag if obviously fake)

important: give an incremental completion % based on NEW info shared in this conversation only. this gets added to their existing %.

incremental scoring:
- mentioned where they're from: +25%
- mentioned their work/job: +25% 
- mentioned any hobby/interest: +20%
- bonus for being friendly: +5%
- bonus for sharing details: +5%

examples that count:
- location: "i'm from nyc", "live in london", "based in sf" 
- work: "i'm a dev", "work at a startup", "studying cs", "between jobs"
- hobbies: "i like basketball", "read books", "play games", "cook"

just look for new info in this conversation. return 0% if nothing new was shared.

guidelines:
- be fair with scoring
- basic mentions are fine
- casual questions work best
- only score info from THIS conversation`;
