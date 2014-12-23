# Hoarderless Css
Designed to identify css hoarding in a project in 3 steps. Step1 - Enter the path to your view code, Step2 - enter the path to your css code, Step3 - Click OK to write the new css that will have unused selectors commented. The original css code remain untouched.

### Running in the browser
```javascript
    > npm start
```

### Running from the command line
##### Install and link to run locally
```javascript
    > npm link
```

##### command line example
```javascript
    > hoarderless --viewtype html --viewpath path/to/your/view/folder --stylepath path/to/your/css/folder
```

##### Options:
```javascript
    -t, --viewtype        a string for view type (html)
    -v, --viewpath        a string for view path (/path/to/your/view/folder)
    -s, --stylepath       a string for stylesheet path (/path/to/your/css/folder)
```

### Specs
Currently this tool identifies any of the selector types listed below or any combination. These include some of the more commonly used combinators, and selector types
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



