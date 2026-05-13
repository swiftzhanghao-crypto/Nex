package boot

import "strings"

func sqliteFilePathFromLink(link string) (path string, ok bool) {
	const prefix = "sqlite::@file("
	if !strings.HasPrefix(link, prefix) {
		return "", false
	}
	rest := strings.TrimPrefix(link, prefix)
	idx := strings.LastIndex(rest, ")")
	if idx <= 0 {
		return "", false
	}
	return rest[:idx], true
}
