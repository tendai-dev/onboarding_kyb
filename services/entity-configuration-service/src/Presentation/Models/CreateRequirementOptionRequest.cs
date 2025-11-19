using System.ComponentModel.DataAnnotations;

namespace EntityConfigurationService.Presentation.Models;

public class CreateRequirementOptionRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Value { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string DisplayText { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int DisplayOrder { get; set; } = 0;
}
