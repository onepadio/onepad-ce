export class Desktop{
    createdAt: any;
    isDefault: any;
    name: any;
    state: any;
    updatedAt: any;
    workspace: any;
    constructor(name: any, workspace: any, isDefault: any, state: any, createdAt = Date.now(), updatedAt = Date.now()){
        this.name = name;
        this.workspace = workspace;
        this.isDefault = isDefault;
        this.state = state;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}