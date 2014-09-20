# Hoarderless Css
Designed to identify css hoarding in a project. Enter the path to your view code, then enter the path to your css files, then step3, you can write the new css files that will have unused selectors commented. The original css files remain untouched.

### Running in the browser

    node server

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


