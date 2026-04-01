const fs = require('fs');
const https = require('https');
const path = require('path');

const screensDataPath = 'C:/Users/abdul/.gemini/antigravity/brain/997e0063-1ad7-4d0c-a29d-72da33e67f62/.system_generated/steps/15/output.txt';
const projectPath = 'C:/Users/abdul/.gemini/antigravity/brain/997e0063-1ad7-4d0c-a29d-72da33e67f62/.system_generated/steps/36/output.txt';

const outputDir = path.join('d:/AppDev/Discounty/new desighn');

// Download a file
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      if (response.statusCode === 302) {
        https.get(response.headers.location, function(res2) {
          res2.pipe(file);
          file.on('finish', function() {
            file.close(resolve);
            console.log("Downloaded", dest);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', function() {
          file.close(resolve);
          console.log("Downloaded", dest);
        });
      }
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const screensContent = fs.readFileSync(screensDataPath, 'utf8');
  const screensData = JSON.parse(screensContent);
  const projectContent = fs.readFileSync(projectPath, 'utf8');
  const projectData = JSON.parse(projectContent);
  
  // Write the design system MD
  if (projectData.designMd) {
    fs.writeFileSync(path.join(outputDir, 'design_system.md'), projectData.designMd, 'utf8');
    console.log("Saved design_system.md");
  }
  
  // Write the project data
  fs.writeFileSync(path.join(outputDir, 'project.json'), JSON.stringify(projectData, null, 2), 'utf8');
  console.log("Saved project.json");

  // Download all screens HTML
  for (const screen of screensData.screens) {
    if (screen.htmlCode && screen.htmlCode.downloadUrl) {
      const fileName = screen.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
      const destPath = path.join(outputDir, fileName);
      try {
        await download(screen.htmlCode.downloadUrl, destPath);
      } catch (err) {
        console.error("Failed to download", screen.title, err);
      }
    }
  }
}

main().catch(console.error);
