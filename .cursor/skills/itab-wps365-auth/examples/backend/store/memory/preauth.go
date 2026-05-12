package memory

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"wps365auth/store"
)

type preAuthEntry struct {
	state     *store.PreAuthState
	expiresAt time.Time
}

// PreAuthStore OAuth 跳转期间的临时 state，纯内存，10 分钟寿命，重启即清。
type PreAuthStore struct {
	mu      sync.Mutex
	entries map[string]*preAuthEntry
}

func NewPreAuthStore() *PreAuthStore {
	s := &PreAuthStore{entries: make(map[string]*preAuthEntry)}
	go s.gc()
	return s
}

func (s *PreAuthStore) Create(_ context.Context, st *store.PreAuthState, ttl time.Duration) error {
	if st.ID == "" {
		st.ID = preAuthRandomHex(32)
	}
	if st.State == "" {
		st.State = preAuthRandomHex(16)
	}
	if st.Nonce == "" {
		st.Nonce = preAuthRandomHex(8)
	}
	st.CreatedAt = time.Now()
	s.mu.Lock()
	s.entries[st.ID] = &preAuthEntry{state: st, expiresAt: time.Now().Add(ttl)}
	s.mu.Unlock()
	return nil
}

func (s *PreAuthStore) Get(_ context.Context, id string) (*store.PreAuthState, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.entries[id]
	if !ok {
		return nil, store.ErrNotFound
	}
	if time.Now().After(e.expiresAt) {
		delete(s.entries, id)
		return nil, store.ErrExpired
	}
	return e.state, nil
}

func (s *PreAuthStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	delete(s.entries, id)
	s.mu.Unlock()
	return nil
}

func (s *PreAuthStore) gc() {
	t := time.NewTicker(2 * time.Minute)
	defer t.Stop()
	for range t.C {
		now := time.Now()
		s.mu.Lock()
		for id, e := range s.entries {
			if now.After(e.expiresAt) {
				delete(s.entries, id)
			}
		}
		s.mu.Unlock()
	}
}

func preAuthRandomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
