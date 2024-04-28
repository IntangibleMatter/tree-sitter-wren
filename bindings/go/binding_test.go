package tree_sitter_wren_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-wren"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_wren.Language())
	if language == nil {
		t.Errorf("Error loading Wren grammar")
	}
}
