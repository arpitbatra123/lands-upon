#!/bin/bash
#
# order - rename files sequentially

# npm i @ayoisaiah/f2 -g is needed to use this script

f2 --exec --replace '{{x.cdt.MMM}}-{{x.cdt.DD}}-{{x.cdt.YYYY}}-{{x.cdt.hh}}-{{x.cdt.mm}}-{{x.cdt.ss}}-{{x.cdt.A}}{{ext}}' -E 'json' $1