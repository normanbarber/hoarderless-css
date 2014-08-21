# Hoarderless Css
This tools designed to identify css hoarding in a project folder. Enter the path to your jade files, then the path to your css files, then clean the code and write new files that have unused selectors commented. The original css files remain untouched.

### Running in the browser

    node server

### Running in the command line
#### Install the package to run locally
    > npm link

#### Enter the command and 2 args ( path1 is the project view folder and path2 is the project css folder )
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


