/** Output shape written to artifacts/runtime_inventory.json */
export type RuntimeInventory = {
    db: {
        dialect?: string;
        entities: {
            id: string;
            fields: {
                id: string;
                type?: string;
            }[];
        }[];
    };
    api: {
        endpoints: ApiEndpoint[];
    };
    ui: {
        reads: string[];
        writes: string[];
    };
};
export type ApiEndpoint = {
    path: string;
    methods: string[];
    returns?: {
        entity: string;
        fields: string[];
    };
};
export declare function buildInventory(cfgPath?: string, outFile?: string): Promise<string>;
//# sourceMappingURL=index.d.ts.map