import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsContentModelGroup } from "../../src/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";

const createIdentity = (permissions: any[] = []): SecurityIdentity => {
    return {
        id: "api123",
        displayName: "a1234567890",
        type: "api-key",
        permissions: [
            {
                name: "cms.settings",
                rwd: "r"
            },
            {
                name: "content.i18n",
                locales: ["en-US"]
            },
            {
                name: "cms.endpoint.manage"
            },
            {
                name: "cms.contentModelGroup",
                rwd: "r"
            },
            {
                name: "cms.contentModel"
            }
        ].concat(permissions)
    };
};

describe("MANAGE - resolvers - api key", () => {
    let contentModelGroup: CmsContentModelGroup;

    const API_TOKEN = "aToken";

    const headers = {
        Authorization: API_TOKEN
    };

    const manageOpts = { path: "manage/en-US" };

    const {
        clearAllIndex,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    beforeEach(async () => {
        try {
            await clearAllIndex();
        } catch {
            // Ignore errors
        }

        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;

        const category = models.find(m => m.modelId === "category");

        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });

        if (update.errors) {
            console.error(`[beforeEach] ${update.errors[0].message}`);
            process.exit(1);
        }
    });

    afterEach(async () => {
        try {
            await clearAllIndex();
        } catch (e) {}
    });

    test("create, get, list, update and delete entry", async () => {
        const {
            until,
            createCategory,
            updateCategory,
            getCategory,
            listCategories,
            deleteCategory
        } = await useCategoryManageHandler({
            ...manageOpts,
            identity: createIdentity([
                {
                    name: "cms.contentEntry",
                    rwd: "rwd"
                }
            ])
        });

        const [createResponse] = await createCategory(
            {
                data: {
                    title: "Vegetables",
                    slug: "vegetables"
                }
            },
            headers
        );

        expect(createResponse).toEqual({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String),
                        title: "Vegetables",
                        slug: "vegetables",
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    slug: "vegetables",
                                    title: "Vegetables"
                                }
                            ],
                            status: "draft",
                            version: 1,
                            title: "Vegetables"
                        }
                    },
                    error: null
                }
            }
        });

        const category = createResponse.data.createCategory.data;

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories({}, headers).then(([data]) => data),
            ({ data }) => data.listCategories.data[0].id === category.id,
            { name: "create category" }
        );

        const [getResponse] = await getCategory(
            {
                revision: category.id
            },
            headers
        );

        expect(getResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        id: category.id,
                        title: category.title,
                        slug: category.slug,
                        createdOn: category.createdOn,
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: category.savedOn,
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: category.id,
                                    slug: "vegetables",
                                    title: "Vegetables"
                                }
                            ],
                            status: "draft",
                            version: 1,
                            title: "Vegetables"
                        }
                    },
                    error: null
                }
            }
        });

        const [updateResponse] = await updateCategory(
            {
                revision: category.id,
                data: {
                    title: "Green vegetables",
                    slug: "green-vegetables"
                }
            },
            headers
        );

        expect(updateResponse).toEqual({
            data: {
                updateCategory: {
                    data: {
                        id: expect.any(String),
                        title: "Green vegetables",
                        slug: "green-vegetables",
                        createdOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "a1234567890",
                            displayName: "a1234567890",
                            type: "api-key"
                        },
                        savedOn: expect.stringMatching(/^20/),
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    slug: "green-vegetables",
                                    title: "Green vegetables"
                                }
                            ],
                            status: "draft",
                            version: 1,
                            title: "Green vegetables"
                        }
                    },
                    error: null
                }
            }
        });

        const updatedCategory = updateResponse.data.updateCategory.data;

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        const listResponse = await until(
            () => listCategories({}, headers).then(([data]) => data),
            ({ data }) => data.listCategories.data[0].slug === updatedCategory.slug,
            { name: `waiting for ${updatedCategory.slug}` }
        );

        expect(listResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: expect.any(String),
                            title: updatedCategory.title,
                            slug: updatedCategory.slug,
                            createdOn: updatedCategory.createdOn,
                            createdBy: {
                                id: "a1234567890",
                                displayName: "a1234567890",
                                type: "api-key"
                            },
                            savedOn: updatedCategory.savedOn,
                            meta: {
                                locked: false,
                                modelId: "category",
                                publishedOn: null,
                                revisions: [
                                    {
                                        id: updatedCategory.id,
                                        slug: updatedCategory.slug,
                                        title: updatedCategory.title
                                    }
                                ],
                                status: "draft",
                                version: 1,
                                title: updatedCategory.title
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const [deleteResponse] = await deleteCategory(
            {
                revision: updatedCategory.id
            },
            headers
        );

        expect(deleteResponse).toEqual({
            data: {
                deleteCategory: {
                    data: true,
                    error: null
                }
            }
        });
    });
});
