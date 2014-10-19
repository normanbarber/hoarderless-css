# Hoarderless Css
Designed to identify css hoarding in a project in 3 steps. Step1 - Enter the path to your view code, then Step 2 - enter the path to your css files, finally in Step3 - Click OK to write the new css files that will have unused selectors commented. The original css files remain untouched.

### Running in the browser

    node server or npm start

### Running in the command line
##### Install the package to run locally
    > npm link

##### Expects 2 arguments (path1 for the projects view folder and path2 for the projects css folder)
    > hoarderless path/to/your/view/folder path/to/your/css/folder

### Specs
Currently this tool identifies any of the selector types listed below or any combination. These include some of the most commonly used combinators but will be including more as I have time
* class
* id
* tag
* complex selectors
* direct child selector
* adjacent selector
* attribute selector
* basic negation
* sibling selector
* nth first and last child


