const fs = require('fs')
const path = require('path')
const glob = require('glob')
const mkdirp = require('mkdirp')

// Function to read the header from a markdown file
function getHeaderData(content) {
    const headerLines = content.split(/\r?\n/)
    const headerData = {};

    headerLines.every(line => {
        const index = line.indexOf(':')
        if (index < 0) return false
        const key = line.substring(0, index).trim()
        const value = line.substring(index + 1).trim()
        if (key && value) {
            headerData[key.toString()] = value.toString()
        }
        return true
    })

    return headerData;
}

function extractDurationAndConvertTotalSeconds(text) {
    const matches = text.matchAll(/Duration: (\d{1,2}:\d{2}:\d{2})/g)
    let totalSeconds = 0
    for (const match of matches) {
        const time = match[1]
        const [hours, minutes, seconds] = time.split(':').map(Number)
        totalSeconds += (hours * 3600 + minutes * 60 + seconds)
    }
    return totalSeconds
}

const MD_FILES_PATTERN = '**/*.md'

// Function to traverse the directory for .md files and read their headers
function readMarkdownHeaders(directoryPath) {
    // Use glob to find files matching the pattern
    const files = glob.sync(MD_FILES_PATTERN, {cwd: directoryPath})
    const result = []

    files.forEach(file => {
        const filePath = path.join(directoryPath, file)
        console.log(filePath)
        const content = fs.readFileSync(filePath, 'utf8')
        const header = getHeaderData(content)
        if (header) {
            header["source"] = file
            header["url"] = `${header["id"]}/index.html`
            header["duration"] = extractDurationAndConvertTotalSeconds(content)
            //if (header['status']?.toLocaleLowerCase() === 'published') {
            result.push(header)
            //} else {
            //    console.log(`Ignoring un-published id=${header['id']}.`)
            //}
        }
    });

    result.forEach(entry => {
        entry['highlight'] = entry['highlight'] === true;
        entry['weight'] = entry['weight'] ? parseInt(entry['weight']) : 0
        entry['categories'] = entry['categories'] ? entry['categories'].split(",").map(item => item.trim()) : []
        entry['tags'] = entry['tags'] ? entry['tags'].split(",").map(item => item.trim()) : []
        entry['author'] = entry['author'] ? entry['author'].split(",").map(item => item.trim()) : []
        entry['environments'] = entry['environments'] ? entry['environments'].split(",").map(item => item.trim()) : []
    })

    return result;
}

function writeToFile(filename, content) {
    fs.writeFile(filename, JSON.stringify(content, null, 2), 'utf8', (err) => {
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
    console.error('Usage: node headers-parser.js <directory> <output_directory>')
    process.exit(1)
}

const markdownDirectory = process.argv[2]
const outputDirectory = process.argv[3]

// Call the function and output the results
const headers = readMarkdownHeaders(markdownDirectory)
console.log(headers)
mkdirp.sync(outputDirectory)
writeToFile(`${outputDirectory}/codelabs.json`, headers)
