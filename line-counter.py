import os

code_directory = "js"

files = []
for (dirpath, dirnames, filenames) in os.walk(code_directory):
    files += [dirpath + '/' + filename for filename in filenames]

lines = 0
myLines = 0
for file in files:
    if '.' not in file:
        continue
    period = file[::-1].index('.')
    extension = file[-period:]
    if extension != 'js':
        continue

    myFile = ('sb1' not in file) and ('zip-js' not in file) and ('allblocks' not in file)

    f = open(file, 'r')
    for line in f:
        lines += 1
        if myFile:
            myLines += 1
print(f"Helium has {lines} lines of javascript code! {myLines} of those were written by ArolaunTech.")
