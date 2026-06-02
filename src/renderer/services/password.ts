import { PasswordRepository } from "../repository/password";

export default class PasswordService {
    static async save(personId: any, hostname: any, username: any, password: any, notes: any, workspace: any) {
        return await PasswordRepository.save(personId, hostname, username, password, notes, workspace);
    }

    static async update(id: any, personId: any, hostname: any, username: any, password: any, notes: any, workspace: any) {
        return await PasswordRepository.update(id, personId, hostname, username, password, notes, workspace);
    }

    static async delete(id: any) {
        return await PasswordRepository.delete(id);
    }

    static async get(id: any) {
        return await PasswordRepository.get(id);
    }

    static async getAll() {
        return await PasswordRepository.getAll();
    }

    static async getAllByPersonId(personId: any) {
        return await PasswordRepository.getAllByPerson(personId);
    }

    static async getAllByPersonIdAndWorkspace(personId: any, workspace: any) {
        return await PasswordRepository.getAllByPersonAndWorkspace(personId, workspace);
    }

    static async getByPersonIdAndHostname(personId: any, hostname: any) {
        // @ts-expect-error
        return await PasswordRepository.getByPersonIdAndHostname(personId, hostname);
    }

    static async searchByPersonId(personId: any, query: any) {
        return await PasswordRepository.search(personId, query);
    }

    static async searchByPersonIdAndWorkspace(personId: any, workspace: any, query: any) {
        return await PasswordRepository.searchByWorkspace(personId, workspace, query);
    }

    static async searchByPersonIdAndHostname(personId: any, hostname: any) {
        return await PasswordRepository.searchByHostname(personId, hostname);
    }

    static async searchByPersonIdAndUsername(personId: any, username: any) {
        return await PasswordRepository.searchByUsername(personId, username);
    }
}