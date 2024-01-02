const fs = require('fs')
const path = require('path')
const glob = require('glob')

const INDEX_FILES_PATTERN = '**/index.html'

function getGoHomePatch(homeUrl) {
    const content = fs.readFileSync('go_home_patch.template', 'utf8')
    return content.replaceAll('{{homeUrl}}', homeUrl)
}

function patchCodelabs(directoryPath, homeUrl) {
    // Use glob to find files matching the pattern
    const files = glob.sync(INDEX_FILES_PATTERN, {cwd: directoryPath})

    files.forEach(file => {
        const filePath = path.join(directoryPath, file)
        console.log(filePath)
        const content = fs.readFileSync(filePath, 'utf8')
        const goHomePatch = getGoHomePatch(homeUrl)
        const newContent = content.replace('</body>', goHomePatch + '</body>')
        writeToFile(filePath, newContent)
    });
}

function writeToFile(filename, content) {
    fs.writeFile(filename, content, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err)
        } else {
            console.log('File written successfully.')
        }
    });
}

const EXPECTED_ARGS_SIZE = 2

if (process.argv.length !== EXPECTED_ARGS_SIZE + 2) {
    console.error(`Error: Expected ${EXPECTED_ARGS_SIZE} arguments.`)
    console.error('Usage: node patch-go-home.js <directory> <home-url>')
    process.exit(1)
}

const codelabsDirectory = process.argv[2]
const homeUrl = process.argv[3]

patchCodelabs(codelabsDirectory, homeUrl)
