# Hoarderless Css
This tools designed to identify css hoarding in a project folder. Enter the path to your jade files, then the path to your css files, then clean the code and write new files that have unused selectors commented. The original css files remain untouched.

### Running in the browser

    node server

### Specs
Currently this tool identifies any of the selector types listed below or any combination of these. These include some of the most commonly used combinators but will be including more as I have time
    * classes                     .someclass
    * ids                         #someid
    * tag                         h1
    * complext selectors          h1.someclass#someid
    * direct child selector       >
    * adjacent selector           +
    * attribute selector          [type=text]
    * basic negation              :not
    * sibling selector            ~
    * nth first and last child    :nth-child(x), :first-chid, :last-child


