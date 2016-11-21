$(function() {
	loadNewProjectsIndex();
	
	var module = angular.module("octopusApp.projects");
    module.config(function($routeProvider, octoRouteProvider) {
        $routeProvider.when("/projects", {
            templateUrl: "areas/projects/views/index_new.html",
            controller: "ProjectIndexControllerFixed",
            title: "Projects",
            tab: "projects"
        });
	});
	
    module.controller("ProjectIndexControllerFixed", function($scope, $routeParams, $location, $timeout, busy, octopusRepository, octopusClient) {
        var isLoading = $scope.isLoading = busy.create();
        $scope.projectGroups = null, $scope.projects = {}, $scope.pulses = {}, $scope.view = {
            showEmptyGroups: !1
        }, $scope.projectCount = 0, $scope.projectsLoading = {}, $scope.projectGroupsWaitingForProjectsToLoad = 0;
        var newProjectGroupId = $routeParams.newProjectGroupId;
        isLoading.promise(octopusRepository.ProjectGroups.all().then(function(results) {
            $scope.projectGroups = results, _.each(results, function(pg) {
                $scope.projectGroupsWaitingForProjectsToLoad++;
                var groupLoading = $scope.projectsLoading[pg.Id] = busy.create();
				
                groupLoading.promise(octopusRepository.Projects.listByGroup(pg).then(function(projects)
				{
					$scope.projects[pg.Id] = projects;
					
					_.map(projects.Items, function(p) {
                        return p.Id
                    });
                    $scope.projectCount = $scope.projectCount + projects.TotalResults, $scope.projectGroupsWaitingForProjectsToLoad--;
					
					var totalPages = Math.ceil(projects.TotalResults / projects.ItemsPerPage);
					
					for (var k = 1; k < totalPages; k++)
					{
						var pageLink = projects.Links["Page." + k];
						
						groupLoading.promise(octopusClient.get(pageLink).then(function(newProjects)
						{
							$scope.projects[pg.Id].Items = $scope.projects[pg.Id].Items.concat(newProjects.Items);
						}));
					}
                }))
            })
        }));
        var hasProjects = function(projectGroup) {
            var projects = $scope.projects[projectGroup.Id];
            return projects && projects.Items.length > 0
        };
        $scope.isGroupVisible = function(projectGroup) {
            return $scope.view.showEmptyGroups || hasProjects(projectGroup) || newProjectGroupId && projectGroup.Id === newProjectGroupId
        }, $scope.anyShowing = function() {
            return _.find($scope.projectGroups, $scope.isGroupVisible)
        }, $scope.anyHiding = function() {
            return _.find($scope.projectGroups, function(g) {
                return !$scope.isGroupVisible(g)
            })
        }, $scope.anyLoading = function() {
            return $scope.isLoading.busy || _.find(_.values($scope.projectsLoading), function(gl) {
                return gl.busy
            })
        }
    });
	
	Octopus.ReleaseMatrix = function(element, taskStatusRenderer, octoUtil) {
        function getTileLink(matrix, item, hasTenants) {
            if (matrix.slice && matrix.slice.projects && hasTenants) {
                var project = _.find(matrix.slice.projects, function(a) {
                    return a.Id === item.ProjectId
                });
                return "#/projects/" + project.Slug + "?release=" + item.ReleaseVersion
            }
            return "#/tasks/" + item.TaskId
        }
        var matrix = this;
        matrix.rows = [], matrix.environments = [], matrix.heading = "", matrix.items = {}, matrix.keyFromPair = function() {}, matrix.environmentsById = {}, matrix.promotions = {}, matrix.previousDeployments = {}, matrix.projectEnvironmentTenantIndex = {}, matrix.environmentTenantIndex = {}, matrix.promoteTo = [], matrix.renderEmptyRow = function(html) {}, matrix.renderEmptyCell = function(key, html) {}, matrix.renderGroupDeployButton = function(env, html) {};
        var previousItems = {};
        matrix.render = function() {
            hasGreaterThanTenEnvironments() && applySparseboard(), fullRender(), previousItems = matrix.items
        }, matrix.update = function() {
            hasGreaterThanTenEnvironments() && applySparseboard(), partialRender(), previousItems = matrix.items
        };
        var fullRender = function() {
                element.html(renderTable()), taskStatusRenderer.bindPopovers($(".status", element)), $("#dynamicallyGeneratedContent").empty(), $(".overflow-scroll").doubleScroll()
            },
            hasGreaterThanTenEnvironments = function() {
                var hasGreaterThanTenEnvironments = matrix.environments.length > 10;
                return hasGreaterThanTenEnvironments
            },
            applySparseboard = function() {
                var keys = _.keys(matrix.items);
                matrix.environments = _.filter(matrix.environments, function(env) {
                    var hasDeploymentInEnv = _.some(keys, function(key) {
                        return key.indexOf(env.Id + "__") >= 0
                    });
                    return hasDeploymentInEnv
                })
            },
            renderTable = function() {
                var html = [];
                return html.push('<div class="margin-bottom-30">'), html.push('<div class="matrix-container ">'), html.push('<div class="overflow-scroll">'), html.push('<table class="matrix">'), renderHeadings(html), html.push("<tbody>"), renderRows(html), html.push("</tbody>"), html.push("</table>"), html.push("</div>"), html.push("</div>"), html.push("</div>"), html.join("")
            },
            renderHeadings = function(html) {
                html.push("<thead>"), html.push("<tr>"), html.push("<th>"), html.push(octoUtil.escapeHtml(matrix.heading)), html.push("</th>"), _.each(matrix.environments, function(env) {
                    html.push("<th>"), html.push('<a href="#/environments">'), html.push(octoUtil.escapeHtml(env.Name)), html.push("</a>"), matrix.renderGroupDeployButton(env, html), html.push("</th>")
                }), html.push('<th style="width: auto"></th>'), html.push("</tr>"), html.push("</thead>")
            },
            getPromotion = function(key, envId) {
                if (matrix.promotions) {
                    var promotion = matrix.promotions[key];
                    if (promotion) return promotion
                }
            },
            renderRows = function(html) {
                var rows = matrix.rows;
                rows && 0 !== rows.length || matrix.renderEmptyRow(html), _.each(rows, function(row) {
                    html.push("<tr>"), html.push('<th class="relative">'), matrix.renderRowHeading(row, html), html.push("</th>"), _.each(matrix.environments, function(col) {
                        var key = matrix.keyFromPair(col, row);
                        html.push('<td id="'), html.push(key), html.push('"'), html.push(">");
                        var items = matrix.items[key],
                            promotion = getPromotion(key, col.Id) || !row.Id && matrix.promoteTo && _.find(matrix.promoteTo, function(env) {
                                return env.Id === col.Id
                            });
                        renderTile(key, items, html, promotion, row, col), html.push("</td>")
                    }), html.push('<td class="last"></td>'), html.push("</tr>")
                })
            },
            getItemToShowOnDashboard = function(deployments) {
                if (!deployments || !deployments[0]) return deployments;
                var sortedDeployments = _.sortBy(deployments, "ReleaseVersion").reverse(),
                    index = _.findIndex(sortedDeployments, function(item) {
                        return "Executing" === item.State || "Failed" === item.State || "Success" === item.State && item.HasWarningsOrErrors
                    });
                return index > -1 ? sortedDeployments[index] : sortedDeployments[0]
            },
            getCompletedItemsCount = function(currentItem, items, tenantsLinked) {
                return _.filter(items, function(item) {
                    return -1 !== tenantsLinked.indexOf(item.TenantId) && "Success" === item.State && item.ReleaseId === currentItem.ReleaseId
                }).length
            },
            renderTile = function(key, items, html, promotion, row, col) {
                if (!items) return void matrix.renderEmptyCell(key, html, promotion, row, col);
                var item = getItemToShowOnDashboard(items),
                    releaseDate = moment(item.QueueTime),
                    tenantsLinked = matrix.projectEnvironmentTenantIndex[key],
                    hasTenants = !!tenantsLinked && tenantsLinked.length > 1;
                if (html.push('<a class="deployment-square" href="'), html.push(getTileLink(matrix, item, hasTenants)), html.push('">'), taskStatusRenderer.render(html, item), html.push('<span class="deployment-square-info">'), html.push('<span class="version">'), html.push('    <span class="release-number">'), html.push(octoUtil.escapeHtml(item.ReleaseVersion)), html.push("    </span>"), hasTenants) {
                    var completedItems = getCompletedItemsCount(item, items, tenantsLinked);
                    html.push('    <span class="label tenant-count">'), html.push('<span class="progress-count">'), html.push(completedItems), html.push("</span>"), html.push('<span class="total-count">'), html.push("/"), html.push(tenantsLinked.length), html.push("</span>"), html.push("    </span>")
                }
                html.push("  </span>"), html.push(' <span class="release-date" title="'), html.push(octoUtil.escapeHtml(releaseDate.format("LLLL"))), html.push('">'), html.push(octoUtil.escapeHtml(releaseDate.format("MMMM Do YYYY"))), html.push("</span>"), html.push("</span>"), html.push("</a>")
            },
            partialRender = function() {
                _.each(matrix.environments, function(env) {
                    _.each(matrix.rows, function(row) {
                        var key = matrix.keyFromPair(env, row),
                            promotion = getPromotion(key, env.Id) || !row.Id && matrix.promoteTo && _.find(matrix.promoteTo, function(environment) {
                                return environment.Id === env.Id
                            }),
                            oldItem = previousItems[key],
                            newItem = matrix.items[key];
                        itemHasChanged(oldItem, newItem) && updateTile(key, newItem, $("#" + key, element), promotion)
                    })
                })
            },
            updateTile = function(key, item, domElement, promotion) {
                var updatedItem = getItemToShowOnDashboard(item),
                    anchor = $("a.deployment-square", domElement);
                if (0 === anchor.length) {
                    var html = [];
                    renderTile(key, updatedItem, html), domElement.html(html.join(""))
                }
                if (anchor = $("a.deployment-square", domElement), 0 !== anchor.length)
                    if (item) {
                        var releaseDate = moment(updatedItem.QueueTime),
                            tenantsLinked = matrix.projectEnvironmentTenantIndex[key] || [],
                            hasTenants = !!tenantsLinked && tenantsLinked.length > 1;
                        if (anchor.attr("href", getTileLink(matrix, item[0], hasTenants)), $(".version .release-number", anchor).text(updatedItem.ReleaseVersion), hasTenants) {
                            var completedItems = getCompletedItemsCount(updatedItem, item, tenantsLinked);
                            $(".version .tenant-count .progress-count", anchor).text(completedItems), $(".version .tenant-count .total-count", anchor).text("/" + tenantsLinked.length)
                        }
                        $(".release-date", anchor).attr("title", releaseDate.format("LLLL")), $(".release-date", anchor).text(releaseDate.format("MMMM Do YYYY")), taskStatusRenderer.update(updatedItem, $(".status", anchor))
                    } else domElement.empty()
            },
            compareValues = function(oldValue, newValue) {
                return angular.toJson(oldValue) !== angular.toJson(newValue)
            },
            itemHasChanged = function(oldItem, newItem) {
                if (!oldItem && newItem) return !0;
                if (oldItem && !newItem) return !0;
                if (!oldItem && !newItem) return !1;
                if (!oldItem[0] && newItem[0] && (newItem = newItem[0]), oldItem[0] && !newItem[0] && (oldItem = oldItem[0]), oldItem[0] && newItem[0]) {
                    if (oldItem.length !== newItem.length) return !0;
                    var oldItemStates = _.countBy(oldItem, function(item) {
                            return item.State
                        }),
                        newItemStates = _.countBy(newItem, function(item) {
                            return item.State
                        });
                    if (compareValues(oldItemStates, newItemStates)) return !0;
                    var oldItemReleaseVersions = _.countBy(oldItem, function(item) {
                            return item.ReleaseVersion
                        }),
                        newItemReleaseVersions = _.countBy(newItem, function(item) {
                            return item.ReleaseVersion
                        });
                    if (compareValues(oldItemReleaseVersions, newItemReleaseVersions)) return !0
                }
                return oldItem.State !== newItem.State ? !0 : "Executing" === oldItem.State || "Queued" === oldItem.State || "Paused" === oldItem.State ? !0 : oldItem.Id !== newItem.Id
            }
    };
});

function loadNewProjectsIndex()
{
	var module;
	
	try {
		module = angular.module("templates-obj/templates-app.js")
	} catch (e) {
		module = angular.module("templates-obj/templates-app.js", [])
	}
	module.run(["$templateCache", function($templateCache) {
		xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", updatedProjectsIndex, false);
		xmlhttp.send(null);
		
		$templateCache.put("areas/projects/views/index_new.html", xmlhttp.responseText);
	}]);
}