# Audotics Data Flow Diagrams

This document provides visual representations of the data flows within the Audotics platform, demonstrating how information moves between different components of the system.

## System-Level Data Flow

The following diagram illustrates the high-level data flow across the entire Audotics platform:

```
                      ┌──────────────┐
                      │     User     │
                      └───────┬──────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│                  Web Application                     │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   API Gateway                        │
└───────┬───────────┬────────────┬────────────┬───────┘
        │           │            │            │
        ▼           ▼            ▼            ▼
┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐
│   User   │ │  Playlist  │ │  Music   │ │  Analytics   │
│ Service  │ │  Service   │ │ Service  │ │   Service    │
└────┬─────┘ └─────┬──────┘ └─────┬────┘ └──────┬───────┘
     │             │              │             │
     │             │              │             │
     └─────────────┼──────────────┼─────────────┘
                   │              │
                   ▼              ▼
┌─────────────────────────┐ ┌────────────────────────┐
│    Database Layer       │ │  ML Service Layer      │
│ (PostgreSQL & Redis)    │ │                        │
└─────────────────────────┘ └────────────────────────┘
```

## User Authentication Flow

```
┌──────┐          ┌──────────┐             ┌───────────────┐      ┌────────────┐
│ User │          │ Frontend │             │ Auth Service  │      │  Database  │
└──┬───┘          └────┬─────┘             └───────┬───────┘      └─────┬──────┘
   │                   │                           │                    │
   │ Login Request     │                           │                    │
   │ ─────────────────>│                           │                    │
   │                   │ Authentication Request    │                    │
   │                   │ ─────────────────────────>│                    │
   │                   │                           │ Verify Credentials │
   │                   │                           │ ──────────────────>│
   │                   │                           │                    │
   │                   │                           │ User Data          │
   │                   │                           │ <──────────────────│
   │                   │                           │                    │
   │                   │                           │ Generate JWT       │
   │                   │                           │ ─────┐             │
   │                   │                           │      │             │
   │                   │                           │ <────┘             │
   │                   │ JWT Token                 │                    │
   │                   │ <─────────────────────────│                    │
   │ Session Token     │                           │                    │
   │ <─────────────────│                           │                    │
   │                   │                           │                    │
```

## Music Recommendation Flow

```
┌──────────┐       ┌────────────┐      ┌─────────────────┐     ┌─────────────┐     ┌───────────────┐
│   User   │       │  Frontend  │      │ Recommendation  │     │   Music     │     │   Database    │
│          │       │            │      │    Service      │     │   Service   │     │               │
└────┬─────┘       └─────┬──────┘      └────────┬────────┘     └──────┬──────┘     └───────┬───────┘
     │                   │                      │                      │                    │
     │ Request           │                      │                      │                    │
     │ Recommendations   │                      │                      │                    │
     │ ─────────────────>│                      │                      │                    │
     │                   │ Get                  │                      │                    │
     │                   │ Recommendations      │                      │                    │
     │                   │ ─────────────────────>                      │                    │
     │                   │                      │ Get User History     │                    │
     │                   │                      │ ─────────────────────>                    │
     │                   │                      │                      │ Query User History │
     │                   │                      │                      │ ──────────────────>│
     │                   │                      │                      │                    │
     │                   │                      │                      │ User History       │
     │                   │                      │                      │ <──────────────────│
     │                   │                      │ User History         │                    │
     │                   │                      │ <─────────────────────                    │
     │                   │                      │                      │                    │
     │                   │                      │ Generate             │                    │
     │                   │                      │ Recommendations      │                    │
     │                   │                      │ ─────┐               │                    │
     │                   │                      │      │               │                    │
     │                   │                      │ <────┘               │                    │
     │                   │                      │                      │                    │
     │                   │                      │ Get Track Details    │                    │
     │                   │                      │ ─────────────────────>                    │
     │                   │                      │                      │ Query Tracks       │
     │                   │                      │                      │ ──────────────────>│
     │                   │                      │                      │                    │
     │                   │                      │                      │ Track Details      │
     │                   │                      │                      │ <──────────────────│
     │                   │                      │                      │                    │
     │                   │                      │ Track Details        │                    │
     │                   │                      │ <─────────────────────                    │
     │                   │ Recommendations      │                      │                    │
     │                   │ with Track Details   │                      │                    │
     │                   │ <─────────────────────                      │                    │
     │ Display           │                      │                      │                    │
     │ Recommendations   │                      │                      │                    │
     │ <─────────────────│                      │                      │                    │
     │                   │                      │                      │                    │
```

## Playlist Creation Flow

```
┌──────────┐       ┌────────────┐      ┌─────────────────┐     ┌───────────────┐
│   User   │       │  Frontend  │      │ Playlist        │     │   Database    │
│          │       │            │      │ Service         │     │               │
└────┬─────┘       └─────┬──────┘      └────────┬────────┘     └───────┬───────┘
     │                   │                      │                      │
     │ Create Playlist   │                      │                      │
     │ ─────────────────>│                      │                      │
     │                   │ Create Playlist      │                      │
     │                   │ ─────────────────────>                      │
     │                   │                      │ Store Playlist       │
     │                   │                      │ ─────────────────────>
     │                   │                      │                      │
     │                   │                      │ Confirmation         │
     │                   │                      │ <─────────────────────
     │                   │ Playlist Created     │                      │
     │                   │ <─────────────────────                      │
     │ Playlist          │                      │                      │
     │ Confirmation      │                      │                      │
     │ <─────────────────│                      │                      │
     │                   │                      │                      │
```

## User Activity Tracking Flow

```
┌──────────┐       ┌────────────┐      ┌─────────────────┐     ┌───────────────┐
│   User   │       │  Frontend  │      │ Analytics       │     │  Database     │
│          │       │            │      │ Service         │     │               │
└────┬─────┘       └─────┬──────┘      └────────┬────────┘     └───────┬───────┘
     │                   │                      │                      │
     │ User Action       │                      │                      │
     │ (Play, Like, etc) │                      │                      │
     │ ─────────────────>│                      │                      │
     │                   │ Track Event          │                      │
     │                   │ ─────────────────────>                      │
     │                   │                      │ Store Event          │
     │                   │                      │ ─────────────────────>
     │                   │                      │                      │
     │                   │                      │ Confirmation         │
     │                   │                      │ <─────────────────────
     │                   │ Acknowledgment       │                      │
     │                   │ <─────────────────────                      │
     │                   │                      │                      │
     │                   │                      │ Update User Profile  │
     │                   │                      │ ─────────────────────>
     │                   │                      │                      │
     │                   │                      │ Confirmation         │
     │                   │                      │ <─────────────────────
     │                   │                      │                      │
```

## Data Storage and Retrieval

The following diagram shows how data is stored and retrieved across different storage systems:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                               Application Layer                           │
└───────────────┬───────────────────────────────────┬───────────────────────┘
                │                                   │
                ▼                                   ▼
┌────────────────────────────────┐   ┌───────────────────────────────────┐
│        Operational Data        │   │          Analytical Data          │
│                                │   │                                   │
│ ┌──────────────┐ ┌───────────┐ │   │ ┌───────────────┐ ┌─────────────┐ │
│ │  PostgreSQL  │ │   Redis   │ │   │ │  Data Lake    │ │  Analytics  │ │
│ │  (Primary    │ │  (Cache/  │ │   │ │  (Raw Event   │ │  Database   │ │
│ │   Storage)   │ │   Queue)  │ │   │ │   Storage)    │ │  (Processed │ │
│ └──────┬───────┘ └─────┬─────┘ │   │ └───────┬───────┘ │   Data)     │ │
│        │               │       │   │         │         └─────┬───────┘ │
│        └───────────────┘       │   │         └───────────────┘         │
└────────────────────────────────┘   └───────────────────────────────────┘
                │                                   │
                └───────────────────┬───────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            Data Processing Layer                          │
│                                                                           │
│  ┌─────────────────────┐   ┌────────────────────┐   ┌─────────────────┐  │
│  │ Real-time Processing│   │ Batch Processing   │   │ ETL Pipelines   │  │
│  └─────────────────────┘   └────────────────────┘   └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

## Machine Learning Data Flow

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   Raw Data     │     │  Feature       │     │   Model        │
│   Collection   │────>│  Engineering   │────>│   Training     │
└────────────────┘     └────────────────┘     └────────────────┘
                                                      │
                                                      ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   User         │     │  Real-time     │     │   Trained      │
│   Request      │────>│  Inference     │<────│   Models       │
└────────────────┘     └────────────────┘     └────────────────┘
                               │
                               ▼
                       ┌────────────────┐
                       │ Recommendation │
                       │   Results      │
                       └────────────────┘
```

## Event-Driven Architecture Flow

```
┌────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│            │     │             │     │              │     │            │
│  Event     │     │   Event     │     │   Event      │     │  Event     │
│  Producer  │────>│   Bus       │────>│   Consumer   │────>│  Processor │
│            │     │             │     │              │     │            │
└────────────┘     └─────────────┘     └──────────────┘     └────────────┘
                                                                   │
                                                                   ▼
                                                           ┌────────────────┐
                                                           │                │
                                                           │  Database      │
                                                           │                │
                                                           └────────────────┘
``` 