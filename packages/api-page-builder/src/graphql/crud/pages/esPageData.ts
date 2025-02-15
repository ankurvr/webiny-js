import { PbContext } from "../../types";

export const getESPageData = (context: PbContext, page) => {
    return {
        __type: "page",
        tenant: context.security.getTenant().id,
        webinyVersion: context.WEBINY_VERSION,
        id: page.id,
        pid: page.pid,
        editor: page.editor,
        locale: page.locale,
        createdOn: page.createdOn,
        savedOn: page.savedOn,
        createdBy: page.createdBy,
        ownedBy: page.ownedBy,
        category: page.category,
        version: page.version,
        title: page.title,
        titleLC: page.title.toLowerCase(),
        path: page.path,
        status: page.status,
        locked: page.locked,
        publishedOn: page.publishedOn,

        // Pull tags & snippet from settings.general.
        tags: page?.settings?.general?.tags || [],
        snippet: page?.settings?.general?.snippet || null,

        // Save some images that could maybe be used on listing pages.
        images: {
            general: page?.settings?.general?.image
        }
    };
};

export const getESLatestPageData = (context: PbContext, page) => {
    return { ...getESPageData(context, page), latest: true };
};

export const getESPublishedPageData = (context: PbContext, page) => {
    return { ...getESPageData(context, page), published: true };
};
