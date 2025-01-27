import * as cheerio from 'cheerio';
import color from 'picocolors';
import open from '@rdsq/open';

import {
  intro,
  outro,
  log,
  confirm,
  select,
} from '@clack/prompts';

const rootUrl = 'https://docs.deno.com';
const examplesUrl = `${rootUrl}/examples/`;

interface Example {
  title: string;
  url: string;
}

// Fetch a bunch of examples from the web
// and extract their titles and urls
const gatherExamples = async () => {
  const $ = await cheerio.fromURL(examplesUrl);
  return $.extract({
    sections: [
      {
        selector: 'section',
        value: {
          name: 'h2',
          links: [{
            selector: 'a.learn-link',
            value: (el) => {
              const title = $(el).text() || '';
              const url = $(el).attr('href') || '';
              return { title, url };
            }
          }]
        }
      }
    ]
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

  const data = await gatherExamples();
  const options = data.sections.map((el) => ({value: el.name, label: el.name}));
  const section = await select({
    message: 'There examples on a range of topics. Pick one to explore:',
    options: options
  });


  // get links from sections object where the label matches the section
  // and offer a random selection of 5
  const links = data.sections.find((el) => el.name === section)?.links || [];
  
  
  const nugs = getRandomExamples(links, 5).map(({ url, title }) => ({ value: url, label: title || '' }));
  const nugget = await select({
    message: 'Here are a few random nuggets from the ' + color.yellow(section as string) + ' section',
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
    message: 'Want to see some other examples?',
  });
  if(more) {
    offerNuggets();
  } else {
    outro(color.yellow(`Find lots more examples at ${examplesUrl}`)) ;
  }

}

// Show a simple CLI to offer nuggets of useful information from the examples
if (import.meta.main) {
  console.log(`
    🔥 🌶️ 🌶️ 🌶️ 🌶️  🔥
  `);  
  intro(color.yellow(color.inverse(' Deno Nuggies ')));
  log.info("Let's find you a nugget of info from the Deno examples");   
  await sleep(1000);
  offerNuggets();  
}
