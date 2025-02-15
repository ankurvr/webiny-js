import { Context, ContextPlugin } from "@webiny/handler/types";
import { CmsContext } from "../types";

interface CmsHttpParameters {
    type: string;
    locale: string;
}

const throwPlainError = (type: string): void => {
    throw new Error(`Missing context.http.request.path parameter "${type}".`);
};

export const extractHandlerHttpParameters = (context: Context): CmsHttpParameters => {
    const { key = "" } = context.http.request.path.parameters || {};
    const [type, locale] = key.split("/");
    if (!type) {
        throwPlainError("type");
    } else if (!locale) {
        throwPlainError("locale");
    }

    return {
        type,
        locale
    };
};

const setContextCmsVariables = async (context: CmsContext): Promise<void> => {
    const locale = await context.i18n.getLocale(context.cms.locale);
    if (!locale) {
        throw new Error(`There is no locale "${context.cms.locale}" in the system.`);
    }
    context.cms.getLocale = () => locale;
};
// eslint-disable-next-line
export default (options: any = {}): ContextPlugin<CmsContext> => ({
    type: "context",
    apply: async context => {
        if (context.http.request.method === "OPTIONS") {
            return;
        }

        const { type, locale } = extractHandlerHttpParameters(context);

        context.cms = {
            ...(context.cms || ({} as any)),
            type,
            locale,
            READ: type === "read",
            PREVIEW: type === "preview",
            MANAGE: type === "manage"
        };

        await setContextCmsVariables(context);
    }
});
