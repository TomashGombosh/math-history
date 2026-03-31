var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = (wrapped, expect, requestContext) => describe('OpenAPI', () => {
    it('should get openapi document', () => __awaiter(this, void 0, void 0, function* () {
        const response = yield wrapped.run({
            requestContext,
            path: `/openapi`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toBeDefined();
        response.body = JSON.parse(response.body);
        expect(response.body).toBeDefined();
    }));
});
