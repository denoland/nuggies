import * as cheerio from 'cheerio';
import color from 'picocolors';
import open from '@rdsq/open';

import {
  intro,
  outro,
  log,
  confirm,
  select,
  spinner,
} from '@clack/prompts';

const rootUrl = 'https://docs.deno.com';
const examplesUrl = `${rootUrl}/examples/`;

interface Example {
  text: string;
  href: string;
}


// Fetch a bunch of examples from the web
// and extract their titles and urls
const gatherExamples = async () => {
  const $ = await cheerio.fromURL(examplesUrl);
  return $.extract({
    examples: [{
      selector: 'a.learn-link',
      value: (el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text() || '';
        return { text, href };
      },
    }],
  });
}


// get random items from the examples array
const getRandomExamples = (examples: Example[], n: number): Example[] => {
  return examples.sort(() => Math.random() - 0.5).slice(0, n);
}

// rest here a while, my sweet 
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Offer a random selection of nuggets to explore
const offerNuggets = async () => {
  
  const s = spinner();
  const data = await gatherExamples();
  s.start("Fetching examples...");
  await sleep(500);
  s.stop("Found some at " + color.cyan(examplesUrl));
  
  const nugs = getRandomExamples(data.examples, 5).map(({text, href}) => ({value: href, label: text}));
  const nugget = await select({
    message: 'Take your pick.',
    options: nugs
  });
  
  log.info(`You can see that here: ${color.cyan(rootUrl + String(nugget))}`);
  const shouldVisit = await confirm({
    message: 'Shall we take a look?',
  });
  if(shouldVisit) {
    await open(`${rootUrl}${String(nugget)}`);
  }

  const more = await confirm({
    message: 'Want some more?',
  });
  if(more) {
    offerNuggets();
  } else {
    outro(color.yellow(`Find lots more examples at ${examplesUrl}`)) ;
  }

}

// Shwo a simple CLI to offer nuggets if unfo from the examples
if (import.meta.main) {

  console.log(`
    🔥 🌶️ 🌶️ 🌶️ 🌶️  🔥
  `);  
  intro(color.yellow(color.inverse(' Deno Nuggies ')));
  log.info("Let's find you a nugget of info from the Deno examples ");
    
  offerNuggets();  

}
