# Running Application Tests

This is the quick-start to CodeIgniter testing. Its intent is to describe what
it takes to set up your application and get it ready to run unit tests.
It is not intended to be a full description of the test features that you can
use to test your application. Those details can be found in the documentation.

## Resources

* [CodeIgniter 4 User Guide on Testing](https://codeigniter4.github.io/userguide/testing/index.html)
* [PHPUnit docs](https://phpunit.de/documentation.html)
* [Any tutorials on Unit testing in CI4?](https://forum.codeigniter.com/showthread.php?tid=81830)

## Requirements

The project uses PHPUnit 11.5. It is listed in the `require-dev` section of
**composer.json** and can easily be installed
via [Composer](https://getcomposer.org/) if you don't already have it installed globally.

```console
> composer install
```

If running under macOS or Linux, you can create a symbolic link to make running tests a touch nicer.

```console
> ln -s ./vendor/bin/phpunit ./phpunit
```

You also need to install [XDebug](https://xdebug.org/docs/install) or PCOV in order
for code coverage to be calculated successfully. With `XDebug`, you must add `xdebug.mode=coverage` in the **php.ini** file to enable code coverage.

## Setting Up

The application tests in **tests/unit/** mock the models and need no database.
Only CodeIgniter's example tests in **tests/database/** and **tests/session/** use one:
the `tests` group in **app/Config/Database.php**, an in-memory SQLite database
(the PHP `sqlite3` extension must be enabled). To test against another database, edit the
`tests` group or the database settings in **phpunit.xml**.
More details on a test database setup are in the
[Testing Your Database](https://codeigniter4.github.io/userguide/testing/database.html) section of the documentation.

## Running the tests

The entire test suite can be run by simply typing one command-line command from the main directory.

```console
> ./phpunit
```

If you are using Windows, use the following command.

```console
> vendor\bin\phpunit
```

You can limit tests to those within a single test directory by specifying the
directory name after phpunit.

```console
> ./phpunit tests/unit
```

## Generating Code Coverage

To generate coverage information, including HTML reports you can view in your browser,
you can use the following command:

```console
> ./phpunit --colors --coverage-text=tests/coverage.txt --coverage-html=tests/coverage/ -d memory_limit=1024m
```

This runs all of the tests again collecting information about how many lines,
functions, and files are tested. It also reports the percentage of the code that is covered by tests.
It is collected in two formats: a simple text file that provides an overview as well
as a comprehensive collection of HTML files that show the status of every line of code in the project.

The text file can be found at **tests/coverage.txt**.
The HTML files can be viewed by opening **tests/coverage/index.html** in your favorite browser.

## PHPUnit XML Configuration

The repository has a ``phpunit.xml.dist`` file in the `server/` directory that's used for
PHPUnit configuration. This is used to provide a default configuration if you
do not have your own configuration file in the project root.

The normal practice would be to copy ``phpunit.xml.dist`` to ``phpunit.xml``
(which is git ignored), and to tailor it as you see fit.
For instance, you might wish to exclude database tests. The `.dist` file already
writes Clover and HTML coverage reports to **build/logs/** whenever coverage is collected.

## Test Cases

Every test needs a *test case*, or class that your tests extend. CodeIgniter 4
provides a few that you may use directly:
* `CodeIgniter\Test\CIUnitTestCase` - for basic tests with no other service needs
* `CodeIgniter\Test\DatabaseTestTrait` - for tests that need database access

Most of the time you will want to write your own test cases to hold functions and services
common to your test suites.

## Creating Tests

All tests go in the **tests/** directory. Each test file is a class that extends a
**Test Case** (see above) and contains methods for the individual tests. These method
names must start with the word "test" and should have descriptive names for precisely what
they are testing:
`testUserCanModifyFile()` `testOutputColorMatchesInput()` `testIsLoggedInFailsWithInvalidUser()`

Writing tests is an art, and there are many resources available to help learn how.
Review the links above and always pay attention to your code coverage.

### Database Tests

Tests can include migrating, seeding, and testing against a mock or live<sup>1</sup> database.
Be sure to modify the test case (or create your own) to point to your seed and migrations
and include any additional steps to be run before tests in the `setUp()` method.

<sup>1</sup> Note: If you are using database tests that require a live database connection
you will need to rename **phpunit.xml.dist** to **phpunit.xml**, uncomment the database
configuration lines and add your connection details. Prevent **phpunit.xml** from being
tracked in your repo by adding it to **.gitignore**.
