# data-flow-diagram.md - Implementation low Section

## 
`file-list.md``implementation-flow`Mermaid

---

~~~mermaid
graph TD
    subgraph Browser[""]
        User() -- "1. / " --> Route["Route (index.tsx)"]
        User -- "5.  & " --> Action_Trigger
    end

    subgraph Server[""]
        direction TB
        
        subgraph Loader["loader (index.tsx)"]
            Loader_Start("Start") --> Lib_Def["1. <br/>(implementationlowDefinition)"]
            Lib_Def --> DataIO_Check["2. <br/>(checkImplementationiles)"]
            DataIO_Check --> Lib_Build["3. UI<br/>(implementationlowBuilder)"]
            Lib_Build --> Loader_End("End")
        end
        
        Route -- "2. loader" --> Loader_Start
        Loader_End -- "3. JSON" --> Route

        subgraph Action["action (index.tsx)"]
            Action_Trigger --> Action_Start("Start")
            Action_Start -- "" --> DataIO_Retry["6. <br/>(executeRetry.server)"]
            DataIO_Retry --> Action_End("End")
        end

        Action_End -- "7. " --> Route

        subgraph Lib["  (app/lib)"]
            Lib_Def["implementationlowDefinition<br/>(file-list.md)"]
            Lib_Build["implementationlowBuilder<br/>()"]
        end

        subgraph DataIO["  (app/data-io)"]
            DataIO_Check["checkImplementationiles.server<br/>()"]
            DataIO_Retry["executeRetry.server<br/>()"]
        end
    end

    subgraph Client[" (React)"]
        IS["ImplementationlowSection<br/>()"] --> CG["ComponentGroup"]
        CG --> GH["GroupHeader"] & TSP["TestScriptPair"]
        TSP --> C["ileCard<br/>()"]
        C -- "" --> Lib_Pair["filePairMatcher<br/>()"]
        Lib_Pair -- "" --> IS
        Route -- "4. props" --> IS
    end
~~~