@echo off

REM Requirements:
REM - NodeJS (http://nodejs.org/)
REM - Mocha (npm install -g mocha)
REM - Java JRE

cls
set BASE_DIR=%~dp0

@echo.
@echo Running all tests...
@echo -------------------------------------------------------------------

@echo Running server tests...
node "%BASE_DIR%\..\node_modules\mocha\bin\mocha" -R spec "%BASE_DIR%\..\test\unit\server"

@echo all test suites complete
@echo -------------------------------------------------------------------
